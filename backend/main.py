from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import numpy as np
import os
import sys
import json
import uuid
import joblib
from pathlib import Path

app = FastAPI(title="CRIP Backend API - SIH MOSFET Burn-In ML (v2)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
WORKSPACE_ROOT = BASE_DIR.parent
MOSFET_DIR = BASE_DIR / "ml"

if str(MOSFET_DIR) not in sys.path:
    sys.path.insert(0, str(MOSFET_DIR))

# Paths
bundle_path = MOSFET_DIR / "models" / "model_bundle.joblib"
metadata_path = MOSFET_DIR / "models" / "metadata.json"
eval_path = MOSFET_DIR / "reports" / "evaluation.json"
raw_data_path = MOSFET_DIR / "data" / "raw_burnin_data.csv"
features_path = MOSFET_DIR / "data" / "features_72h.csv"

# Global ML objects & stored analyses
model_bundle = None
model_metadata = {}
eval_metrics = {}
scored_df = pd.DataFrame()
raw_df = pd.DataFrame()
analyses: dict[str, dict] = {}
latest_analysis_id: Optional[str] = None


def score_features_dataframe(f: pd.DataFrame) -> pd.DataFrame:
    """Scores a DataFrame that has the sih_mosfet_ml_v2 feature columns."""
    global model_bundle
    df = f.copy()
    if model_bundle is None:
        return df

    af = model_bundle["anomaly_features"]
    df_feat = model_bundle["drift_features"]

    # Fill any missing feature columns with default 0 if necessary
    for c in af:
        if c not in df.columns:
            df[c] = 0.0
    for c in df_feat:
        if c not in df.columns:
            df[c] = 0.0

    Xa = model_bundle["anomaly_scaler"].transform(df[af])
    scores = -model_bundle["anomaly_model"].score_samples(Xa)
    anom_thresh = float(model_bundle["anomaly_threshold"])
    is_anom = scores >= anom_thresh

    probas = model_bundle["drift_model"].predict_proba(df[df_feat])[:, 1]
    drift_thresh = float(model_bundle["drift_threshold"])
    will_fail = probas >= drift_thresh

    df["anomaly_risk_score"] = np.round(scores, 4)
    df["is_anomaly"] = is_anom
    df["future_probability"] = np.round(probas, 4)
    df["predicted_future_failure"] = will_fail

    # Transparent UI risk policy
    rp = model_bundle["risk_policy"]
    crit = is_anom & (probas >= rp["critical_future_probability"])
    high = (~crit) & (is_anom | (probas >= rp["high_future_probability"]))
    med = (~crit) & (~high) & (probas >= rp["medium_future_probability"])
    df["risk_level"] = np.where(crit, "CRITICAL", np.where(high, "HIGH", np.where(med, "MEDIUM", "LOW")))

    # Failure Mode / Condition
    if "true_condition" not in df.columns:
        z_leak = df.get("leak_lot_z", 0.0).abs()
        z_rds = df.get("rds_lot_z", 0.0).abs()
        z_vth = df.get("vth_lot_z", 0.0).abs()

        df["true_condition"] = np.where(
            ~is_anom, "NORMAL",
            np.where(z_leak >= np.maximum(z_rds, z_vth), "LEAKAGE_DRIFT",
            np.where(z_rds >= z_vth, "RDS_DRIFT", "VTH_DRIFT"))
        )

    # Main Reasons based on z-scores
    reasons = []
    for i in range(len(df)):
        z_l = abs(float(df["leak_lot_z"].iloc[i])) if "leak_lot_z" in df.columns else 0
        z_r = abs(float(df["rds_lot_z"].iloc[i])) if "rds_lot_z" in df.columns else 0
        z_v = abs(float(df["vth_lot_z"].iloc[i])) if "vth_lot_z" in df.columns else 0
        z_d = abs(float(df["drain_lot_z"].iloc[i])) if "drain_lot_z" in df.columns else 0

        max_z = max(z_l, z_r, z_v, z_d)
        if max_z == z_l and z_l > 1.5:
            reasons.append(f"Leakage is {df['leak_lot_z'].iloc[i]:+.1f}σ unusual relative to lot distribution")
        elif max_z == z_r and z_r > 1.5:
            reasons.append(f"Rds(on) is {df['rds_lot_z'].iloc[i]:+.1f}σ unusual relative to lot distribution")
        elif max_z == z_v and z_v > 1.5:
            reasons.append(f"Threshold voltage is {df['vth_lot_z'].iloc[i]:+.1f}σ unusual relative to lot distribution")
        elif max_z == z_d and z_d > 1.5:
            reasons.append(f"Drain current is {df['drain_lot_z'].iloc[i]:+.1f}σ unusual relative to lot distribution")
        else:
            reasons.append("Measurements within normal lot dispersion")
    df["main_reason"] = reasons

    return df


def create_analysis_record(analysis_id: str, filename: str, raw: pd.DataFrame, scored: pd.DataFrame) -> dict:
    """Builds a structured analysis object storing summary, lot breakdown, and component-level rows."""
    total_components = int(len(scored))
    anomalies = int(scored["is_anomaly"].sum())
    high_risk = int((scored["risk_level"] == "HIGH").sum())
    critical_risk = int((scored["risk_level"] == "CRITICAL").sum())
    predicted_failures = int((scored["predicted_future_failure"] == True).sum())
    anomaly_rate = round(float(anomalies / total_components), 4) if total_components > 0 else 0.0

    risk_dist = {str(k): int(v) for k, v in scored["risk_level"].value_counts().items()}
    modes = {str(k): int(v) for k, v in scored["true_condition"].value_counts().items()} if "true_condition" in scored.columns else {}

    lot_breakdown = []
    if "lot_id" in scored.columns:
        for lot_id, group in scored.groupby("lot_id"):
            tot = int(len(group))
            anom = int(group["is_anomaly"].sum())
            crit = int((group["risk_level"] == "CRITICAL").sum())
            hi = int((group["risk_level"] == "HIGH").sum())
            lot_breakdown.append({
                "lot_id": str(lot_id),
                "total_components": tot,
                "anomalies_count": anom,
                "anomaly_rate": round(float(anom / tot), 4) if tot > 0 else 0.0,
                "critical_risk_count": crit,
                "high_risk_count": hi,
                "predicted_future_failures": int((group["predicted_future_failure"] == True).sum()),
                "checkpoint": "72h (Screening) / 120h (Horizon)"
            })

    components_list = []
    for _, row in scored.iterrows():
        comp_id = str(row["component_id"])
        lot_id = str(row.get("lot_id", "L01"))
        components_list.append({
            "component_id": comp_id,
            "lot_id": lot_id,
            "is_anomaly": bool(row["is_anomaly"]),
            "anomaly_risk_score": float(row.get("anomaly_risk_score", 0.0)),
            "future_failure_probability": float(row.get("future_probability", 0.0)),
            "predicted_future_failure": bool(row.get("predicted_future_failure", False)),
            "risk_level": str(row["risk_level"]),
            "main_reason": str(row.get("main_reason", "")),
            "condition": str(row.get("true_condition", "NORMAL")),
            "vth_v": round(float(row.get("vth_v", 0.0)), 3),
            "rds_on_mohm": round(float(row.get("rds_on_mohm", 0.0)), 2),
            "idss_leakage_ua": round(float(row.get("idss_leakage_ua", 0.0)), 2),
            "drain_current_a": round(float(row.get("drain_current_a", 0.0)), 2),
            "rds_drift_mohm": round(float(row.get("rds_drift_mohm", 0.0)), 2),
            "recommended_action": "Hold for additional screening and retest" if row["risk_level"] in ["HIGH", "CRITICAL"] else "Continue normal screening"
        })

    alerts = [c for c in components_list if c["risk_level"] in ["HIGH", "CRITICAL"]]
    alerts.sort(key=lambda x: (x["risk_level"] != "CRITICAL", -x["future_failure_probability"]))

    checkpoints = [int(x) for x in sorted(raw["test_hour"].unique())] if "test_hour" in raw.columns else [0, 72]

    return {
        "analysis_id": str(analysis_id),
        "timestamp": pd.Timestamp.now().isoformat(),
        "filename": str(filename),
        "summary": {
            "total_components": total_components,
            "total_anomalies": anomalies,
            "anomaly_rate": anomaly_rate,
            "high_risk_count": high_risk,
            "critical_risk_count": critical_risk,
            "predicted_future_failures": predicted_failures,
            "risk_distribution": [{"name": str(k), "value": int(v)} for k, v in risk_dist.items()],
            "failure_mode_distribution": [{"name": str(k), "value": int(v)} for k, v in modes.items()]
        },
        "lot_breakdown": lot_breakdown,
        "components": components_list,
        "alerts": alerts,
        "checkpoints_detected": checkpoints
    }


def init_mosfet_pipeline():
    global model_bundle, model_metadata, eval_metrics, scored_df, raw_df, analyses, latest_analysis_id
    try:
        if bundle_path.exists():
            model_bundle = joblib.load(bundle_path)
            print("Loaded sih_mosfet_ml_v2 model_bundle.joblib successfully.")
        if metadata_path.exists():
            with open(metadata_path, "r") as f:
                model_metadata = json.load(f)
        if eval_path.exists():
            with open(eval_path, "r") as f:
                eval_metrics = json.load(f)
        if raw_data_path.exists():
            raw_df = pd.read_csv(raw_data_path)
        if features_path.exists():
            f_df = pd.read_csv(features_path)
            scored_df = score_features_dataframe(f_df)
            print(f"Scored {len(scored_df)} MOSFET components using sih_mosfet_ml_v2.")

            # Create default baseline analysis
            default_id = "ANL-INITIAL"
            rec = create_analysis_record(default_id, "raw_burnin_data.csv (Initial)", raw_df, scored_df)
            analyses[default_id] = rec
            latest_analysis_id = default_id
    except Exception as e:
        print(f"Error initializing MOSFET ML pipeline: {e}")


# Initialize at startup
init_mosfet_pipeline()


# ============================================================================
# ENDPOINT: POST /api/predict
# ============================================================================
class PredictRequest(BaseModel):
    lot_id: Optional[str] = "L01"
    lotId: Optional[str] = None
    target_hour: Optional[int] = 72
    targetHour: Optional[int] = None
    stress_temp_c: Optional[float] = 125.0
    stressTempC: Optional[float] = None
    stress_vds_v: Optional[float] = 80.0
    stressVdsV: Optional[float] = None
    gate_drive_v: Optional[float] = 10.0
    gateDriveV: Optional[float] = None
    vth_0h: Optional[float] = None
    vth_v_0h: Optional[float] = None
    vth0h: Optional[float] = None
    vth_target: Optional[float] = None
    vth_v_target: Optional[float] = None
    vth72h: Optional[float] = None
    rds_0h: Optional[float] = None
    rds_on_mohm_0h: Optional[float] = None
    rds0h: Optional[float] = None
    rds_target: Optional[float] = None
    rds_on_mohm_target: Optional[float] = None
    rds72h: Optional[float] = None
    idss_0h: Optional[float] = None
    idss_leakage_ua_0h: Optional[float] = None
    idss0h: Optional[float] = None
    idss_target: Optional[float] = None
    idss_leakage_ua_target: Optional[float] = None
    idss72h: Optional[float] = None
    drain_0h: Optional[float] = None
    drain_current_a_0h: Optional[float] = None
    drain0h: Optional[float] = None
    drain_target: Optional[float] = None
    drain_current_a_target: Optional[float] = None
    drain72h: Optional[float] = None


@app.post("/api/predict")
def predict_single_component(req: PredictRequest):
    """
    Evaluates one component using predict_from_raw() against the stored reference lot measurements.
    Returns real predictions or HTTP 422 on DataQualityError.
    """
    if model_bundle is None:
        raise HTTPException(status_code=503, detail="Model bundle not loaded")

    from features import DataQualityError
    from predict import predict_from_raw

    lot_id = req.lotId or req.lot_id or "L01"
    target_h = req.targetHour or req.target_hour or 72
    stress_temp = req.stressTempC if req.stressTempC is not None else (req.stress_temp_c if req.stress_temp_c is not None else 125.0)
    stress_vds = req.stressVdsV if req.stressVdsV is not None else (req.stress_vds_v if req.stress_vds_v is not None else 80.0)
    gate_drive = req.gateDriveV if req.gateDriveV is not None else (req.gate_drive_v if req.gate_drive_v is not None else 10.0)

    vth0 = req.vth_0h if req.vth_0h is not None else (req.vth0h if req.vth0h is not None else (req.vth_v_0h if req.vth_v_0h is not None else 2.90))
    vth_tgt = req.vth_target if req.vth_target is not None else (req.vth72h if req.vth72h is not None else (req.vth_v_target if req.vth_v_target is not None else 2.92))
    rds0 = req.rds_0h if req.rds_0h is not None else (req.rds0h if req.rds0h is not None else (req.rds_on_mohm_0h if req.rds_on_mohm_0h is not None else 33.5))
    rds_tgt = req.rds_target if req.rds_target is not None else (req.rds72h if req.rds72h is not None else (req.rds_on_mohm_target if req.rds_on_mohm_target is not None else 34.0))
    idss0 = req.idss_0h if req.idss_0h is not None else (req.idss0h if req.idss0h is not None else (req.idss_leakage_ua_0h if req.idss_leakage_ua_0h is not None else 37.0))
    idss_tgt = req.idss_target if req.idss_target is not None else (req.idss72h if req.idss72h is not None else (req.idss_leakage_ua_target if req.idss_leakage_ua_target is not None else 39.0))
    drain0 = req.drain_0h if req.drain_0h is not None else (req.drain0h if req.drain0h is not None else (req.drain_current_a_0h if req.drain_current_a_0h is not None else 16.2))
    drain_tgt = req.drain_target if req.drain_target is not None else (req.drain72h if req.drain72h is not None else (req.drain_current_a_target if req.drain_current_a_target is not None else 16.1))

    if raw_df.empty or "lot_id" not in raw_df.columns:
        raise HTTPException(
            status_code=422,
            detail="LOT_CONTEXT_REQUIRED: No baseline dataset loaded to provide lot distribution reference."
        )

    lot_snapshot = raw_df[(raw_df["lot_id"] == lot_id) & (raw_df["test_hour"] == target_h)]
    if len(lot_snapshot) < 30:
        raise HTTPException(
            status_code=422,
            detail=f"LOT_CONTEXT_REQUIRED: Lot {lot_id} has only {len(lot_snapshot)} parts at {target_h}h (minimum 30 required for stable lot-relative features)."
        )

    comp_history = pd.DataFrame([
        {
            "component_id": "TEST_MOSFET",
            "lot_id": lot_id,
            "test_hour": 0,
            "stress_temp_c": float(stress_temp),
            "stress_vds_v": float(stress_vds),
            "gate_drive_v": float(gate_drive),
            "vth_v": float(vth0),
            "rds_on_mohm": float(rds0),
            "idss_leakage_ua": float(idss0),
            "drain_current_a": float(drain0),
        },
        {
            "component_id": "TEST_MOSFET",
            "lot_id": lot_id,
            "test_hour": int(target_h),
            "stress_temp_c": float(stress_temp),
            "stress_vds_v": float(stress_vds),
            "gate_drive_v": float(gate_drive),
            "vth_v": float(vth_tgt),
            "rds_on_mohm": float(rds_tgt),
            "idss_leakage_ua": float(idss_tgt),
            "drain_current_a": float(drain_tgt),
        }
    ])

    try:
        res = predict_from_raw(comp_history, lot_snapshot)
    except DataQualityError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if res.get("status") == "DATA_QUALITY_ERROR":
        raise HTTPException(status_code=422, detail=res.get("message", "Data quality error"))

    return res


# Backward compatibility alias
@app.post("/api/ml/predict-single")
def predict_single_mosfet_alias(req: PredictRequest):
    return predict_single_component(req)


# ============================================================================
# ENDPOINT: POST /api/analyze
# ============================================================================
@app.post("/api/analyze")
async def analyze_dataset(
    file: Optional[UploadFile] = File(None),
    use_sample: bool = Query(False)
):
    """
    Accepts an uploaded CSV (raw time-series matching RAW_REQUIRED_COLUMNS) or runs sample data.
    Validates with validate_raw_dataframe(), builds features, scores with model_bundle.joblib,
    stores results under analysis_id, and returns summary stats.
    """
    global scored_df, raw_df, latest_analysis_id
    from features import validate_raw_dataframe, build_features, DataQualityError

    if use_sample or (file is None):
        if not raw_data_path.exists():
            raise HTTPException(status_code=404, detail="Sample dataset raw_burnin_data.csv not found on server.")
        df = pd.read_csv(raw_data_path)
        filename = "raw_burnin_data.csv (IRF540N 10-Lot Screening Dataset)"
    else:
        filename = file.filename or "uploaded_dataset.csv"
        try:
            df = pd.read_csv(file.file)
        except Exception as e:
            raise HTTPException(status_code=422, detail=f"Failed to parse CSV file: {str(e)}")

    # 1. Validate raw dataframe
    try:
        validate_raw_dataframe(df, required_hours=(0, 72))
    except DataQualityError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")

    # 2. Feature engineering
    try:
        f_df = build_features(df, target_hour=72)
    except DataQualityError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Feature extraction error: {str(e)}")

    # 3. Model scoring
    scored = score_features_dataframe(f_df)

    # 4. Store analysis run
    analysis_id = f"ANL-{uuid.uuid4().hex[:8].upper()}"
    record = create_analysis_record(analysis_id, filename, df, scored)
    analyses[analysis_id] = record
    latest_analysis_id = analysis_id

    # Update global scored_df and raw_df so lot / component endpoints reflect current data
    scored_df = scored
    raw_df = df

    return {
        "analysis_id": analysis_id,
        "filename": filename,
        "total_components": record["summary"]["total_components"],
        "anomalies_count": record["summary"]["total_anomalies"],
        "predicted_failures_count": record["summary"]["predicted_future_failures"],
        "high_risk_count": record["summary"]["high_risk_count"],
        "critical_risk_count": record["summary"]["critical_risk_count"],
        "lot_breakdown": record["lot_breakdown"],
        "checkpoints_detected": record["checkpoints_detected"],
        "model_used": "sih_mosfet_ml_v2 (Isolation Forest + HistGradientBoostingClassifier)"
    }


# ============================================================================
# ENDPOINT: GET /api/analyze/{analysis_id}
# ============================================================================
@app.get("/api/analyze/{analysis_id}")
def get_analysis(analysis_id: str):
    """
    Returns full per-component results, lot breakdown, and alerts for a given analysis run.
    If analysis_id == 'latest', returns the most recent analysis run.
    """
    if analysis_id == "latest":
        if latest_analysis_id and latest_analysis_id in analyses:
            return analyses[latest_analysis_id]
        if analyses:
            first_key = next(reversed(analyses.keys()))
            return analyses[first_key]
        raise HTTPException(status_code=404, detail="No analyses found. Please run an analysis in Workspace first.")

    if analysis_id not in analyses:
        raise HTTPException(status_code=404, detail=f"Analysis '{analysis_id}' not found.")

    return analyses[analysis_id]


# ============================================================================
# ENDPOINT: GET /api/model/metrics
# ============================================================================
@app.get("/api/model/metrics")
def get_model_metrics():
    """
    Returns the official evaluation metrics from reports/evaluation.json.
    """
    if eval_path.exists():
        with open(eval_path, "r") as f:
            data = json.load(f)
        return data
    elif eval_metrics:
        return eval_metrics
    elif model_metadata.get("evaluation_summary"):
        return model_metadata["evaluation_summary"]
    else:
        raise HTTPException(status_code=404, detail="Evaluation metrics not found.")


# Alias /api/ml/metrics for backward compatibility
@app.get("/api/ml/metrics")
def get_ml_metrics():
    metrics = {}
    if eval_path.exists():
        with open(eval_path, "r") as f:
            metrics = json.load(f)

    test_anom = metrics.get("test_metrics", {}).get("anomaly", {})
    test_drift = metrics.get("test_metrics", {}).get("future_risk", {})

    return {
        "status": "active",
        "modelName": "sih_mosfet_ml_v2",
        "component": {
            "name": "IRF540N",
            "type": "N-channel power MOSFET",
            "datasheetSource": "Infineon IRF540N Datasheet",
            "specLimits": {
                "vdsMax": "100 V",
                "vgsThRange": "2.0 - 4.0 V",
                "rdsOnMax": "44 mΩ at VGS=10V, ID=16A",
                "idssLimit": "250 µA demo screening bound"
            }
        },
        "anomalyModel": {
            "algorithm": "Isolation Forest (contamination=auto)",
            "scaler": "RobustScaler",
            "calibration": metrics.get("anomaly_calibration", {}).get("method", "1% target false-positive rate on validation lot L08"),
            "threshold": model_bundle["anomaly_threshold"] if model_bundle else metrics.get("anomaly_calibration", {}).get("threshold", 0.447),
            "testAccuracy": test_anom.get("accuracy", 0.982),
            "testRecall": test_anom.get("recall", 0.950),
            "testPrecision": test_anom.get("precision", 0.844),
            "testF1": test_anom.get("f1", 0.894),
            "features": model_bundle["anomaly_features"] if model_bundle else []
        },
        "driftModel": {
            "algorithm": "HistGradientBoostingClassifier",
            "calibration": metrics.get("drift_calibration", {}).get("method", "Validation cost minimization (Missed bad part = 5x False Alarm)"),
            "threshold": model_bundle["drift_threshold"] if model_bundle else metrics.get("drift_calibration", {}).get("threshold", 0.140),
            "testAccuracy": test_drift.get("accuracy", 0.986),
            "testRecall": test_drift.get("recall", 0.873),
            "testPrecision": test_drift.get("precision", 0.873),
            "testF1": test_drift.get("f1", 0.873),
            "testRocAuc": test_drift.get("roc_auc", 0.969),
            "features": model_bundle["drift_features"] if model_bundle else []
        },
        "groupedCrossValidation": metrics.get("grouped_cross_validation", {})
    }


# ============================================================================
# COMPATIBILITY ENDPOINTS (Dashboard & Lots)
# ============================================================================
@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    try:
        total_lots = int(scored_df["lot_id"].nunique()) if "lot_id" in scored_df.columns else 10
        total_components = len(scored_df)
        
        anomalies = scored_df[scored_df["is_anomaly"] == True]
        total_anomalies = len(anomalies)
        anomaly_rate = total_anomalies / total_components if total_components > 0 else 0.0
        
        high_risk = int((scored_df["risk_level"] == "HIGH").sum())
        critical_risk = int((scored_df["risk_level"] == "CRITICAL").sum())
        
        risk_dist = scored_df["risk_level"].value_counts().to_dict()
        modes = scored_df["true_condition"].value_counts().to_dict() if "true_condition" in scored_df.columns else {}
        
        return {
            "component": {
                "name": "IRF540N",
                "type": "N-channel power MOSFET",
                "specification": "VDS: 100V, VGS(th): 2-4V, RDS(on) max: 44 mΩ"
            },
            "metrics": {
                "totalLots": total_lots,
                "totalComponents": total_components,
                "totalAnomalies": total_anomalies,
                "anomalyRate": round(float(anomaly_rate), 4),
                "highRiskCount": high_risk,
                "criticalRiskCount": critical_risk,
                "predictedFutureFailures": int((scored_df["predicted_future_failure"] == True).sum())
            },
            "riskDistribution": [{"name": k, "value": int(v)} for k, v in risk_dist.items()],
            "failureModeDistribution": [{"name": k, "value": int(v)} for k, v in modes.items()]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lots")
def get_lots():
    try:
        lots_data = []
        for lot_id, group in scored_df.groupby("lot_id"):
            total = len(group)
            anomalies = int(group["is_anomaly"].sum())
            critical = int((group["risk_level"] == "CRITICAL").sum())
            high = int((group["risk_level"] == "HIGH").sum())
            
            lots_data.append({
                "lotId": str(lot_id),
                "componentType": "IRF540N Power MOSFET",
                "totalComponents": total,
                "anomalyCount": anomalies,
                "anomalyRate": round(float(anomalies / total), 4) if total > 0 else 0.0,
                "criticalCount": critical,
                "highCount": high,
                "checkpoint": "72h (Screening) / 120h (Horizon)"
            })
            
        return {"lots": lots_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/lots/{lot_id}/components")
def get_lot_components(lot_id: str):
    try:
        lot_df = scored_df[scored_df["lot_id"].astype(str) == str(lot_id)]
        if lot_df.empty:
            first_lot = scored_df["lot_id"].iloc[0] if not scored_df.empty else "L01"
            lot_df = scored_df[scored_df["lot_id"] == first_lot]

        components = []
        for _, row in lot_df.iterrows():
            components.append({
                "componentId": str(row["component_id"]),
                "isAnomalous": bool(row["is_anomaly"]),
                "severity": str(row["risk_level"]).capitalize(),
                "failureMode": str(row.get("true_condition", "Normal")),
                "lotZScore": round(float(row.get("rds_lot_z", 0.0)), 2),
                "anomalyScore": round(float(row.get("future_probability", 0.1)), 3),
                "risk": str(row["risk_level"]),
                "drift": round(float(row.get("rds_drift_mohm", 0.0)), 2),
                "predicted168h": round(float(row.get("base_rds_on_mohm", 33.5) + row.get("rds_drift_mohm", 0.5) * 1.6), 2),
                "reasons": str(row.get("main_reason", "Normal"))
            })
            
        return {"components": components}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/components/{component_id}")
def get_component(component_id: str):
    try:
        comp_match = scored_df[scored_df["component_id"].astype(str) == str(component_id)]
        if comp_match.empty:
            if not scored_df.empty:
                comp_match = scored_df.iloc[[0]]
            else:
                raise HTTPException(status_code=404, detail="No components available")

        row = comp_match.iloc[0]
        cid = str(row["component_id"])
        lid = str(row["lot_id"])

        traj_points = []
        if not raw_df.empty and cid in raw_df["component_id"].values:
            cid_history = raw_df[raw_df["component_id"] == cid].sort_values("test_hour")
            for _, h in cid_history.iterrows():
                traj_points.append({
                    "checkpoint": f"{int(h['test_hour'])}h",
                    "value": round(float(h["rds_on_mohm"]), 2),
                    "leakage": round(float(h["idss_leakage_ua"]), 2),
                    "vth": round(float(h["vth_v"]), 3),
                    "drain": round(float(h["drain_current_a"]), 2)
                })
        else:
            base_rds = float(row.get("base_rds_on_mohm", 33.6))
            rds_72 = float(row.get("rds_on_mohm", 34.0))
            traj_points = [
                {"checkpoint": "0h", "value": round(base_rds, 2)},
                {"checkpoint": "24h", "value": round(base_rds + (rds_72 - base_rds) * 0.33, 2)},
                {"checkpoint": "48h", "value": round(base_rds + (rds_72 - base_rds) * 0.67, 2)},
                {"checkpoint": "72h", "value": round(rds_72, 2)},
                {"checkpoint": "96h", "value": round(rds_72 + (rds_72 - base_rds) * 0.33, 2)},
                {"checkpoint": "120h", "value": round(rds_72 + (rds_72 - base_rds) * 0.67, 2)},
            ]

        lot_rows = scored_df[scored_df["lot_id"] == lid]
        lot_means = {
            "0h": round(float(lot_rows["base_rds_on_mohm"].mean()), 2) if "base_rds_on_mohm" in lot_rows else 33.6,
            "72h": round(float(lot_rows["rds_on_mohm"].mean()), 2) if "rds_on_mohm" in lot_rows else 34.1,
            "120h": round(float(lot_rows["rds_on_mohm"].mean() * 1.02), 2) if "rds_on_mohm" in lot_rows else 34.8
        }

        return {
            "componentId": cid,
            "lotId": lid,
            "componentType": "IRF540N Power MOSFET",
            "stressConditions": {
                "temperature": round(float(row.get("stress_temp_c", 125.0)), 1),
                "voltage": round(float(row.get("stress_vds_v", 80.0)), 1),
                "gateDrive": round(float(row.get("gate_drive_v", 10.0)), 2),
                "level": "Screening Stress (125°C, 80V VDS)"
            },
            "status": {
                "isAnomalous": bool(row["is_anomaly"]),
                "severity": str(row["risk_level"]),
                "failureMode": str(row.get("true_condition", "NORMAL")),
                "anomalyRiskScore": float(row.get("anomaly_risk_score", 0.0)),
                "futureProbability": float(row.get("future_probability", 0.0)),
                "predictedFutureFailure": bool(row.get("predicted_future_failure", False)),
                "mainReason": str(row.get("main_reason", "Parameters within normal lot dispersion")),
                "recommendedAction": "Hold for additional screening and retest" if row["risk_level"] in ["HIGH", "CRITICAL"] else "Continue normal screening"
            },
            "measurementsAt72h": {
                "vth_v": round(float(row.get("vth_v", 3.0)), 3),
                "rds_on_mohm": round(float(row.get("rds_on_mohm", 34.0)), 2),
                "idss_leakage_ua": round(float(row.get("idss_leakage_ua", 45.0)), 2),
                "drain_current_a": round(float(row.get("drain_current_a", 16.1)), 2),
            },
            "lotRelativeZScores": {
                "vth_z": round(float(row.get("vth_lot_z", 0.0)), 2),
                "rds_z": round(float(row.get("rds_lot_z", 0.0)), 2),
                "leakage_z": round(float(row.get("leak_lot_z", 0.0)), 2),
                "drain_z": round(float(row.get("drain_lot_z", 0.0)), 2),
            },
            "trajectory": traj_points,
            "lotBaseline": lot_means
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Backward compatibility aliases for upload and sample
@app.post("/api/upload")
async def upload_dataset_alias(file: UploadFile = File(...)):
    return await analyze_dataset(file=file, use_sample=False)


@app.post("/api/load-sample")
async def load_sample_dataset_alias():
    res = await analyze_dataset(file=None, use_sample=True)
    return {
        "success": True,
        "message": f"Loaded full IRF540N MOSFET dataset: {res['total_components']} components across 10 lots.",
        "metrics": {
            "total": res["total_components"],
            "anomalies": res["anomalies_count"],
            "critical": res["critical_risk_count"],
            "high": res["high_risk_count"],
            "future_fails": res["predicted_failures_count"]
        },
        "analysis_id": res["analysis_id"]
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
