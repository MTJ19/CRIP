
from __future__ import annotations
import numpy as np
import pandas as pd
from config import (
    SIM_SCREENING_LIMITS, MIN_LOT_CONTEXT_SIZE, STD_EPS
)

RAW_REQUIRED_COLUMNS = [
    "component_id", "lot_id", "test_hour",
    "stress_temp_c", "stress_vds_v", "gate_drive_v",
    "vth_v", "rds_on_mohm", "idss_leakage_ua", "drain_current_a"
]

MEASUREMENT_COLUMNS = ["vth_v", "rds_on_mohm", "idss_leakage_ua", "drain_current_a"]

class DataQualityError(ValueError):
    pass

def validate_raw_dataframe(df: pd.DataFrame, required_hours=(0, 72)) -> None:
    missing_cols = [c for c in RAW_REQUIRED_COLUMNS if c not in df.columns]
    if missing_cols:
        raise DataQualityError(f"Missing required columns: {missing_cols}")

    numeric_cols = [
        "test_hour", "stress_temp_c", "stress_vds_v", "gate_drive_v",
        "vth_v", "rds_on_mohm", "idss_leakage_ua", "drain_current_a"
    ]
    if df[numeric_cols].isna().any().any():
        bad = df[numeric_cols].isna().sum()
        bad = bad[bad > 0].to_dict()
        raise DataQualityError(f"Missing numeric measurements detected: {bad}")

    arr = df[numeric_cols].to_numpy(dtype=float)
    if not np.isfinite(arr).all():
        raise DataQualityError("Non-finite numeric value detected (inf/-inf/NaN).")

    duplicates = df.duplicated(["component_id", "test_hour"])
    if duplicates.any():
        bad_ids = df.loc[duplicates, "component_id"].head(5).tolist()
        raise DataQualityError(f"Duplicate component/hour rows found, examples: {bad_ids}")

    if required_hours:
        hour_sets = df.groupby("component_id")["test_hour"].apply(set)
        missing = [
            cid for cid, hrs in hour_sets.items()
            if not set(required_hours).issubset(hrs)
        ]
        if missing:
            raise DataQualityError(
                f"{len(missing)} components are missing required hours {required_hours}; "
                f"examples: {missing[:5]}"
            )

def _lot_stats_at_hour(df: pd.DataFrame, hour: int) -> pd.DataFrame:
    current = df[df["test_hour"] == hour]
    counts = current.groupby("lot_id")["component_id"].nunique()
    too_small = counts[counts < MIN_LOT_CONTEXT_SIZE]
    if not too_small.empty:
        raise DataQualityError(
            f"Insufficient lot context at {hour}h. Need >= {MIN_LOT_CONTEXT_SIZE} components; "
            f"bad lots: {too_small.to_dict()}"
        )

    records = []
    for lot_id, g in current.groupby("lot_id"):
        rec = {"lot_id": lot_id}
        for col, short in [
            ("vth_v","vth"), ("rds_on_mohm","rds"),
            ("idss_leakage_ua","leak"), ("drain_current_a","drain")
        ]:
            std = float(g[col].std(ddof=1))
            if not np.isfinite(std) or std <= STD_EPS:
                raise DataQualityError(
                    f"Lot {lot_id} has zero/invalid variance for {col} at {hour}h."
                )
            rec[f"lot_mean_{short}"] = float(g[col].mean())
            rec[f"lot_std_{short}"] = std
        records.append(rec)
    return pd.DataFrame(records)

def build_features(df: pd.DataFrame, target_hour: int = 72) -> pd.DataFrame:
    validate_raw_dataframe(df, required_hours=(0, target_hour))
    work = df.copy().sort_values(["component_id", "test_hour"])

    base = work[work["test_hour"] == 0][
        ["component_id", "vth_v", "rds_on_mohm", "idss_leakage_ua", "drain_current_a"]
    ].rename(columns={
        "vth_v":"base_vth_v",
        "rds_on_mohm":"base_rds_on_mohm",
        "idss_leakage_ua":"base_idss_leakage_ua",
        "drain_current_a":"base_drain_current_a",
    })

    current = work[work["test_hour"] == target_hour].copy()
    current = current.merge(base, on="component_id", how="left", validate="one_to_one")

    if current[["base_vth_v","base_rds_on_mohm","base_idss_leakage_ua","base_drain_current_a"]].isna().any().any():
        raise DataQualityError("A target-hour component is missing its hour-0 baseline.")

    lot_stats = _lot_stats_at_hour(work, target_hour)
    current = current.merge(lot_stats, on="lot_id", how="left", validate="many_to_one")

    current["vth_drift_v"] = current["vth_v"] - current["base_vth_v"]
    current["rds_drift_mohm"] = current["rds_on_mohm"] - current["base_rds_on_mohm"]
    current["leakage_change_ua"] = current["idss_leakage_ua"] - current["base_idss_leakage_ua"]
    current["drain_current_change_a"] = current["drain_current_a"] - current["base_drain_current_a"]

    h = float(target_hour)
    current["vth_slope_v_per_h"] = current["vth_drift_v"] / h
    current["rds_slope_mohm_per_h"] = current["rds_drift_mohm"] / h
    current["leakage_slope_ua_per_h"] = current["leakage_change_ua"] / h
    current["drain_slope_a_per_h"] = current["drain_current_change_a"] / h

    current["vth_lot_z"] = (current["vth_v"] - current["lot_mean_vth"]) / current["lot_std_vth"]
    current["rds_lot_z"] = (current["rds_on_mohm"] - current["lot_mean_rds"]) / current["lot_std_rds"]
    current["leak_lot_z"] = (current["idss_leakage_ua"] - current["lot_mean_leak"]) / current["lot_std_leak"]
    current["drain_lot_z"] = (current["drain_current_a"] - current["lot_mean_drain"]) / current["lot_std_drain"]

    lim = SIM_SCREENING_LIMITS
    current["vth_margin_low_v"] = current["vth_v"] - lim["vth_min_v"]
    current["vth_margin_high_v"] = lim["vth_max_v"] - current["vth_v"]
    current["rds_margin_to_demo_max_mohm"] = lim["rds_on_max_mohm"] - current["rds_on_mohm"]
    current["leakage_margin_to_demo_limit_ua"] = lim["idss_demo_limit_ua"] - current["idss_leakage_ua"]

    engineered = [
        "vth_drift_v","rds_drift_mohm","leakage_change_ua","drain_current_change_a",
        "vth_slope_v_per_h","rds_slope_mohm_per_h","leakage_slope_ua_per_h","drain_slope_a_per_h",
        "vth_lot_z","rds_lot_z","leak_lot_z","drain_lot_z",
        "vth_margin_low_v","vth_margin_high_v","rds_margin_to_demo_max_mohm",
        "leakage_margin_to_demo_limit_ua",
    ]
    vals = current[engineered].to_numpy(dtype=float)
    if not np.isfinite(vals).all():
        raise DataQualityError("Feature engineering produced a non-finite value.")

    return current

def build_single_component_features(
    component_history: pd.DataFrame,
    lot_snapshot_at_target_hour: pd.DataFrame,
    target_hour: int = 72
) -> pd.DataFrame:
    """
    Backend-friendly raw inference helper.

    component_history:
      raw rows for ONE component including hour 0 and target_hour.
    lot_snapshot_at_target_hour:
      raw target-hour rows for the component's manufacturing lot.

    This function computes all engineered features internally.
    """
    if component_history["component_id"].nunique() != 1:
        raise DataQualityError("component_history must contain exactly one component.")

    lot_ids = component_history["lot_id"].unique()
    if len(lot_ids) != 1:
        raise DataQualityError("component_history must belong to exactly one lot.")
    lot_id = lot_ids[0]

    if lot_snapshot_at_target_hour["lot_id"].nunique() != 1 or lot_snapshot_at_target_hour["lot_id"].iloc[0] != lot_id:
        raise DataQualityError("Lot snapshot does not match the component's lot.")

    # Build a temporary lot dataframe containing all target-hour lot rows plus
    # this component's baseline. Other lot-mates do not need baselines for z-scores.
    temp = pd.concat([
        lot_snapshot_at_target_hour,
        component_history[component_history["test_hour"] == 0]
    ], ignore_index=True)

    # Manual validation suited to single-component inference.
    required = set(RAW_REQUIRED_COLUMNS)
    if not required.issubset(temp.columns):
        raise DataQualityError(f"Missing columns: {sorted(required - set(temp.columns))}")
    if len(lot_snapshot_at_target_hour) < MIN_LOT_CONTEXT_SIZE:
        raise DataQualityError(
            f"LOT_CONTEXT_REQUIRED: need at least {MIN_LOT_CONTEXT_SIZE} target-hour "
            f"lot measurements to calculate stable lot-relative features."
        )

    # Build lot stats directly.
    stats = {}
    for col, short in [
        ("vth_v","vth"), ("rds_on_mohm","rds"),
        ("idss_leakage_ua","leak"), ("drain_current_a","drain")
    ]:
        s = lot_snapshot_at_target_hour[col].astype(float)
        if s.isna().any() or not np.isfinite(s.to_numpy()).all():
            raise DataQualityError(f"Invalid lot context values for {col}.")
        std = float(s.std(ddof=1))
        if std <= STD_EPS:
            raise DataQualityError(f"Lot variance too small for {col}; cannot compute z-score.")
        stats[f"lot_mean_{short}"] = float(s.mean())
        stats[f"lot_std_{short}"] = std

    baseline = component_history[component_history["test_hour"] == 0]
    current = component_history[component_history["test_hour"] == target_hour]
    if len(baseline) != 1 or len(current) != 1:
        raise DataQualityError(f"Need exactly one hour-0 and one hour-{target_hour} row.")

    row = current.iloc[0].to_dict()
    b = baseline.iloc[0]
    row.update(stats)

    row["vth_drift_v"] = row["vth_v"] - b["vth_v"]
    row["rds_drift_mohm"] = row["rds_on_mohm"] - b["rds_on_mohm"]
    row["leakage_change_ua"] = row["idss_leakage_ua"] - b["idss_leakage_ua"]
    row["drain_current_change_a"] = row["drain_current_a"] - b["drain_current_a"]

    h = float(target_hour)
    row["vth_slope_v_per_h"] = row["vth_drift_v"] / h
    row["rds_slope_mohm_per_h"] = row["rds_drift_mohm"] / h
    row["leakage_slope_ua_per_h"] = row["leakage_change_ua"] / h
    row["drain_slope_a_per_h"] = row["drain_current_change_a"] / h

    row["vth_lot_z"] = (row["vth_v"] - stats["lot_mean_vth"]) / stats["lot_std_vth"]
    row["rds_lot_z"] = (row["rds_on_mohm"] - stats["lot_mean_rds"]) / stats["lot_std_rds"]
    row["leak_lot_z"] = (row["idss_leakage_ua"] - stats["lot_mean_leak"]) / stats["lot_std_leak"]
    row["drain_lot_z"] = (row["drain_current_a"] - stats["lot_mean_drain"]) / stats["lot_std_drain"]

    lim = SIM_SCREENING_LIMITS
    row["vth_margin_low_v"] = row["vth_v"] - lim["vth_min_v"]
    row["vth_margin_high_v"] = lim["vth_max_v"] - row["vth_v"]
    row["rds_margin_to_demo_max_mohm"] = lim["rds_on_max_mohm"] - row["rds_on_mohm"]
    row["leakage_margin_to_demo_limit_ua"] = lim["idss_demo_limit_ua"] - row["idss_leakage_ua"]

    return pd.DataFrame([row])
