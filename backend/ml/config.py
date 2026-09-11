
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
MODEL_DIR = ROOT / "models"
REPORT_DIR = ROOT / "reports"

SEED = 42

COMPONENT = {
    "name": "IRF540N",
    "type": "N-channel power MOSFET",
    "datasheet_url": "https://www.infineon.com/assets/row/public/documents/24/49/infineon-irf540n-datasheet-en.pdf",
}

# Values below are datasheet reference specifications.
DATASHEET_REFERENCE = {
    "vds_max_v": 100.0,
    "vgs_threshold_min_v": 2.0,
    "vgs_threshold_max_v": 4.0,
    "rds_on_max_mohm_at_vgs10_id16": 44.0,
    # Datasheet IDSS max depends on test condition; this project keeps leakage
    # as a simulation variable and does NOT claim a 125 C production limit.
}

# Synthetic demo screening limits.
# These are NOT manufacturer qualification criteria.
SIM_SCREENING_LIMITS = {
    "vth_min_v": 2.0,
    "vth_max_v": 4.0,
    "rds_on_max_mohm": 44.0,
    "idss_demo_limit_ua": 250.0,
}

GENERATOR = {
    "n_lots": 10,
    "components_per_lot": 500,
    "hours": [0, 24, 48, 72, 96, 120],
    "normal_fraction": 0.92,
    "failure_probabilities": {
        "LEAKAGE_DRIFT": 0.025,
        "RDS_DRIFT": 0.020,
        "VTH_DRIFT": 0.015,
        "THERMAL_SENSITIVE": 0.010,
        "SUDDEN_DEGRADATION": 0.010,
    },
    "stress_temperature_c_mean": 125.0,
    "stress_temperature_c_sd": 2.0,
    "stress_vds_v_mean": 80.0,
    "stress_vds_v_sd": 1.5,
    "gate_drive_v_mean": 10.0,
    "gate_drive_v_sd": 0.12,
}

# Single source of truth for model feature order.
ANOMALY_FEATURES = [
    "vth_drift_v",
    "rds_drift_mohm",
    "leakage_change_ua",
    "drain_current_change_a",
    "vth_lot_z",
    "rds_lot_z",
    "leak_lot_z",
    "drain_lot_z",
    "vth_slope_v_per_h",
    "rds_slope_mohm_per_h",
    "leakage_slope_ua_per_h",
    "drain_slope_a_per_h",
]

DRIFT_FEATURES = [
    "vth_drift_v",
    "rds_drift_mohm",
    "leakage_change_ua",
    "drain_current_change_a",
    "vth_lot_z",
    "rds_lot_z",
    "leak_lot_z",
    "drain_lot_z",
    "vth_slope_v_per_h",
    "rds_slope_mohm_per_h",
    "leakage_slope_ua_per_h",
    "drain_slope_a_per_h",
    "vth_margin_low_v",
    "vth_margin_high_v",
    "rds_margin_to_demo_max_mohm",
    "leakage_margin_to_demo_limit_ua",
]

TRAIN_LOTS = ["L01", "L02", "L03", "L04", "L05", "L06", "L07"]
VALIDATION_LOTS = ["L08"]
TEST_LOTS = ["L09", "L10"]

# Operational calibration settings, not true anomaly prevalence.
TARGET_FALSE_POSITIVE_RATE = 0.01
FALSE_NEGATIVE_COST = 5.0
FALSE_POSITIVE_COST = 1.0

MIN_LOT_CONTEXT_SIZE = 30
STD_EPS = 1e-9
