
from __future__ import annotations
import joblib
import numpy as np
import pandas as pd
from config import MODEL_DIR
from features import build_single_component_features, DataQualityError

_bundle = joblib.load(MODEL_DIR / "model_bundle.joblib")

def predict_from_raw(
    component_history: pd.DataFrame,
    lot_snapshot_at_72h: pd.DataFrame
) -> dict:
    """
    Accepts RAW measurements, not pre-engineered features.

    Required:
      - component_history: one component's raw rows including hour 0 and hour 72
      - lot_snapshot_at_72h: raw 72h measurements for >=30 parts in the same lot
    """
    try:
        f = build_single_component_features(
            component_history, lot_snapshot_at_72h, target_hour=_bundle["target_hour"]
        )
    except DataQualityError as e:
        return {
            "status": "DATA_QUALITY_ERROR",
            "message": str(e),
        }

    af = _bundle["anomaly_features"]
    df = _bundle["drift_features"]

    Xa = _bundle["anomaly_scaler"].transform(f[af])
    anomaly_risk_score = float(-_bundle["anomaly_model"].score_samples(Xa)[0])
    is_anomaly = anomaly_risk_score >= _bundle["anomaly_threshold"]

    future_probability = float(
        _bundle["drift_model"].predict_proba(f[df])[:,1][0]
    )
    predicted_future_failure = future_probability >= _bundle["drift_threshold"]

    # Transparent UI risk policy.
    rp = _bundle["risk_policy"]
    if is_anomaly and future_probability >= rp["critical_future_probability"]:
        risk = "CRITICAL"
    elif is_anomaly or future_probability >= rp["high_future_probability"]:
        risk = "HIGH"
    elif future_probability >= rp["medium_future_probability"]:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    reason_candidates = {
        "Leakage is unusual relative to its lot": abs(float(f["leak_lot_z"].iloc[0])),
        "Rds(on) is unusual relative to its lot": abs(float(f["rds_lot_z"].iloc[0])),
        "Threshold voltage is unusual relative to its lot": abs(float(f["vth_lot_z"].iloc[0])),
        "Drain current is unusual relative to its lot": abs(float(f["drain_lot_z"].iloc[0])),
    }
    main_reason = max(reason_candidates, key=reason_candidates.get)

    return {
        "status": "OK",
        "component_id": str(f["component_id"].iloc[0]),
        "lot_id": str(f["lot_id"].iloc[0]),
        "anomaly_risk_score": round(anomaly_risk_score, 6),
        "anomaly_threshold": round(float(_bundle["anomaly_threshold"]), 6),
        "is_anomaly": bool(is_anomaly),
        "future_failure_probability": round(future_probability, 6),
        "future_failure_threshold": round(float(_bundle["drift_threshold"]), 6),
        "predicted_future_failure": bool(predicted_future_failure),
        "risk_level": risk,
        "main_reason": main_reason,
        "recommended_action": (
            "Retest and hold for additional screening"
            if risk in {"HIGH","CRITICAL"} else
            "Continue normal screening"
        ),
    }

if __name__ == "__main__":
    from config import DATA_DIR
    raw = pd.read_csv(DATA_DIR / "raw_burnin_data.csv")
    sample_id = raw[raw.test_hour == 72]["component_id"].iloc[0]
    sample_lot = raw.loc[raw.component_id == sample_id, "lot_id"].iloc[0]
    history = raw[(raw.component_id == sample_id) & (raw.test_hour.isin([0,72]))]
    lot72 = raw[(raw.lot_id == sample_lot) & (raw.test_hour == 72)]
    print(predict_from_raw(history, lot72))
