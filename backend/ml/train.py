
from __future__ import annotations
import json
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import IsolationForest, GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, accuracy_score,
    confusion_matrix, roc_auc_score, precision_recall_curve
)
from sklearn.model_selection import GroupKFold
from config import (
    DATA_DIR, MODEL_DIR, REPORT_DIR, SEED,
    ANOMALY_FEATURES, DRIFT_FEATURES,
    TRAIN_LOTS, VALIDATION_LOTS, TEST_LOTS,
    TARGET_FALSE_POSITIVE_RATE, FALSE_NEGATIVE_COST, FALSE_POSITIVE_COST
)
from features import build_features

def anomaly_risk_scores(model, scaler, X):
    # IsolationForest: lower score_samples = more abnormal.
    raw = model.score_samples(scaler.transform(X))
    return -raw  # higher = more abnormal

def calibrate_anomaly_threshold(reference_normal_scores, target_fpr):
    # Select a cutoff that flags approximately target_fpr of known-good reference parts.
    return float(np.quantile(reference_normal_scores, 1.0 - target_fpr))

def choose_cost_sensitive_threshold(y_true, prob, fn_cost, fp_cost):
    candidates = np.unique(np.r_[np.linspace(0.01, 0.99, 99), prob])
    best = None
    for t in candidates:
        pred = (prob >= t).astype(int)
        fn = int(((y_true == 1) & (pred == 0)).sum())
        fp = int(((y_true == 0) & (pred == 1)).sum())
        cost = fn_cost*fn + fp_cost*fp
        rec = (cost, -f1_score(y_true, pred, zero_division=0), float(t))
        if best is None or rec < best:
            best = rec
    return best[2]

def metrics(y, pred, prob=None):
    out = {
        "precision": float(precision_score(y, pred, zero_division=0)),
        "recall": float(recall_score(y, pred, zero_division=0)),
        "f1": float(f1_score(y, pred, zero_division=0)),
        "accuracy": float(accuracy_score(y, pred)),
        "confusion_matrix": confusion_matrix(y, pred).tolist(),
    }
    if prob is not None and len(np.unique(y)) > 1:
        out["roc_auc"] = float(roc_auc_score(y, prob))
    return out

def add_future_target(features72, raw):
    final = raw[raw.test_hour == 120][["component_id","within_demo_screening_bounds"]].copy()
    final["will_cross_demo_limit_by_120h"] = (final["within_demo_screening_bounds"] == 0).astype(int)
    return features72.merge(
        final[["component_id","will_cross_demo_limit_by_120h"]],
        on="component_id", how="left", validate="one_to_one"
    )

def group_cv_report(x):
    groups = x["lot_id"].to_numpy()
    y_a = x["is_injected_anomaly"].to_numpy()
    y_d = x["will_cross_demo_limit_by_120h"].to_numpy()
    gkf = GroupKFold(n_splits=5)

    anomaly_f1 = []
    drift_f1 = []
    drift_auc = []

    for fold, (tr_idx, te_idx) in enumerate(gkf.split(x, groups=groups), start=1):
        tr = x.iloc[tr_idx].copy()
        te = x.iloc[te_idx].copy()

        # Isolation Forest is unsupervised; labels are not used in fit or contamination.
        sc = StandardScaler().fit(tr[ANOMALY_FEATURES])
        iso = IsolationForest(
            n_estimators=300, contamination="auto", random_state=SEED + fold, n_jobs=-1
        ).fit(sc.transform(tr[ANOMALY_FEATURES]))

        tr_scores = anomaly_risk_scores(iso, sc, tr[ANOMALY_FEATURES])
        # Operational calibration: use only known-good reference parts in the training fold
        # to target a 1% false-positive rate. Prevalence of anomalies is not used.
        normal_scores = tr_scores[tr["is_injected_anomaly"].to_numpy() == 0]
        thr = calibrate_anomaly_threshold(normal_scores, TARGET_FALSE_POSITIVE_RATE)
        te_scores = anomaly_risk_scores(iso, sc, te[ANOMALY_FEATURES])
        pa = (te_scores >= thr).astype(int)
        anomaly_f1.append(f1_score(te["is_injected_anomaly"], pa, zero_division=0))

        # Drift model + inner validation by one training lot.
        train_lots = sorted(tr["lot_id"].unique())
        inner_val_lot = train_lots[-1]
        inner_tr = tr[tr.lot_id != inner_val_lot]
        inner_val = tr[tr.lot_id == inner_val_lot]

        dm = GradientBoostingClassifier(
            n_estimators=180, learning_rate=0.045, max_depth=2, random_state=SEED + fold
        ).fit(inner_tr[DRIFT_FEATURES], inner_tr["will_cross_demo_limit_by_120h"])

        pv = dm.predict_proba(inner_val[DRIFT_FEATURES])[:,1]
        dt = choose_cost_sensitive_threshold(
            inner_val["will_cross_demo_limit_by_120h"].to_numpy(),
            pv, FALSE_NEGATIVE_COST, FALSE_POSITIVE_COST
        )

        # Refit on the whole outer training fold after threshold calibration.
        dm.fit(tr[DRIFT_FEATURES], tr["will_cross_demo_limit_by_120h"])
        pt = dm.predict_proba(te[DRIFT_FEATURES])[:,1]
        pd_ = (pt >= dt).astype(int)
        drift_f1.append(f1_score(te["will_cross_demo_limit_by_120h"], pd_, zero_division=0))
        if te["will_cross_demo_limit_by_120h"].nunique() > 1:
            drift_auc.append(roc_auc_score(te["will_cross_demo_limit_by_120h"], pt))

    return {
        "anomaly_f1_by_fold": [float(v) for v in anomaly_f1],
        "anomaly_f1_mean": float(np.mean(anomaly_f1)),
        "anomaly_f1_std": float(np.std(anomaly_f1, ddof=1)),
        "drift_f1_by_fold": [float(v) for v in drift_f1],
        "drift_f1_mean": float(np.mean(drift_f1)),
        "drift_f1_std": float(np.std(drift_f1, ddof=1)),
        "drift_roc_auc_mean": float(np.mean(drift_auc)),
        "drift_roc_auc_std": float(np.std(drift_auc, ddof=1)),
    }

if __name__ == "__main__":
    MODEL_DIR.mkdir(exist_ok=True)
    REPORT_DIR.mkdir(exist_ok=True)

    raw = pd.read_csv(DATA_DIR / "raw_burnin_data.csv")
    f72 = build_features(raw, target_hour=72)
    x = add_future_target(f72, raw)
    x.to_csv(DATA_DIR / "features_72h.csv", index=False)

    train = x[x.lot_id.isin(TRAIN_LOTS)].copy()
    val = x[x.lot_id.isin(VALIDATION_LOTS)].copy()
    test = x[x.lot_id.isin(TEST_LOTS)].copy()

    # -------- Anomaly detector --------
    scaler = StandardScaler().fit(train[ANOMALY_FEATURES])
    iso = IsolationForest(
        n_estimators=400,
        contamination="auto",     # does NOT use the true anomaly rate
        random_state=SEED,
        n_jobs=-1,
    ).fit(scaler.transform(train[ANOMALY_FEATURES]))

    val_scores = anomaly_risk_scores(iso, scaler, val[ANOMALY_FEATURES])
    normal_val_scores = val_scores[val["is_injected_anomaly"].to_numpy() == 0]
    anomaly_threshold = calibrate_anomaly_threshold(
        normal_val_scores, TARGET_FALSE_POSITIVE_RATE
    )

    test_anom_scores = anomaly_risk_scores(iso, scaler, test[ANOMALY_FEATURES])
    test_anom_pred = (test_anom_scores >= anomaly_threshold).astype(int)
    anomaly_test_metrics = metrics(test["is_injected_anomaly"], test_anom_pred)

    # -------- Drift/future-risk model --------
    drift_model = GradientBoostingClassifier(
        n_estimators=180, learning_rate=0.045, max_depth=2, random_state=SEED
    ).fit(train[DRIFT_FEATURES], train["will_cross_demo_limit_by_120h"])

    val_prob = drift_model.predict_proba(val[DRIFT_FEATURES])[:,1]
    drift_threshold = choose_cost_sensitive_threshold(
        val["will_cross_demo_limit_by_120h"].to_numpy(),
        val_prob, FALSE_NEGATIVE_COST, FALSE_POSITIVE_COST
    )

    # Refit on train + validation after the threshold has been frozen.
    train_plus_val = pd.concat([train, val], ignore_index=True)
    drift_model.fit(
        train_plus_val[DRIFT_FEATURES],
        train_plus_val["will_cross_demo_limit_by_120h"]
    )
    test_prob = drift_model.predict_proba(test[DRIFT_FEATURES])[:,1]
    test_drift_pred = (test_prob >= drift_threshold).astype(int)
    drift_test_metrics = metrics(
        test["will_cross_demo_limit_by_120h"], test_drift_pred, test_prob
    )

    # -------- Grouped cross-validation --------
    cv = group_cv_report(x)

    # Bundle keeps models, thresholds, and exact feature order together.
    bundle = {
        "schema_version": 2,
        "target_hour": 72,
        "anomaly_features": ANOMALY_FEATURES,
        "drift_features": DRIFT_FEATURES,
        "anomaly_scaler": scaler,
        "anomaly_model": iso,
        "anomaly_threshold": anomaly_threshold,
        "drift_model": drift_model,
        "drift_threshold": drift_threshold,
        "risk_policy": {
            "critical_future_probability": 0.75,
            "high_future_probability": 0.50,
            "medium_future_probability": 0.25,
            "note": "Risk labels are UI policy bands; the actual future-failure decision threshold is validation-calibrated."
        }
    }
    joblib.dump(bundle, MODEL_DIR / "model_bundle.joblib")

    results = {
        "split": {
            "train_lots": TRAIN_LOTS,
            "validation_lots": VALIDATION_LOTS,
            "test_lots": TEST_LOTS,
        },
        "anomaly_calibration": {
            "method": "1% target false-positive rate on known-good validation reference parts",
            "target_false_positive_rate": TARGET_FALSE_POSITIVE_RATE,
            "threshold": float(anomaly_threshold),
        },
        "drift_calibration": {
            "method": "validation cost minimization",
            "false_negative_cost": FALSE_NEGATIVE_COST,
            "false_positive_cost": FALSE_POSITIVE_COST,
            "threshold": float(drift_threshold),
        },
        "test_metrics": {
            "anomaly": anomaly_test_metrics,
            "future_risk": drift_test_metrics,
        },
        "grouped_cross_validation": cv,
    }
    (REPORT_DIR / "evaluation.json").write_text(json.dumps(results, indent=2))

    # Per-component test predictions
    pred = test[[
        "component_id","lot_id","true_condition","is_injected_anomaly",
        "within_demo_screening_bounds","will_cross_demo_limit_by_120h"
    ]].copy()
    pred["anomaly_risk_score"] = test_anom_scores
    pred["predicted_anomaly"] = test_anom_pred
    pred["future_failure_probability"] = test_prob
    pred["predicted_future_failure"] = test_drift_pred
    pred.to_csv(REPORT_DIR / "test_predictions.csv", index=False)

    print(json.dumps(results, indent=2))
