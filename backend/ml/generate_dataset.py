
from __future__ import annotations
import json
import numpy as np
import pandas as pd
from config import DATA_DIR, SEED, GENERATOR, SIM_SCREENING_LIMITS

def _mode_probabilities():
    probs = {"NORMAL": GENERATOR["normal_fraction"], **GENERATOR["failure_probabilities"]}
    total = sum(probs.values())
    if abs(total - 1.0) > 1e-9:
        raise ValueError(f"Failure probabilities must sum to 1.0, got {total}")
    return list(probs.keys()), np.array(list(probs.values()), dtype=float)

def generate_dataset(seed: int = SEED) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    modes, probs = _mode_probabilities()
    rows = []
    component_index = 1

    for lot_num in range(1, GENERATOR["n_lots"] + 1):
        lot_id = f"L{lot_num:02d}"

        # Lot-to-lot manufacturing shifts (synthetic assumptions).
        lot_vth_shift = rng.normal(0.0, 0.055)
        lot_rds_shift = rng.normal(0.0, 0.90)
        lot_leakage_factor = np.exp(rng.normal(0.0, 0.10))
        lot_drain_shift = rng.normal(0.0, 0.22)

        for _ in range(GENERATOR["components_per_lot"]):
            cid = f"M{component_index:05d}"
            component_index += 1
            mode = str(rng.choice(modes, p=probs))
            abnormal = mode != "NORMAL"
            severity = rng.uniform(0.75, 1.35) if abnormal else 0.0

            # Component baseline distribution (synthetic assumptions).
            vth0 = np.clip(rng.normal(3.00 + lot_vth_shift, 0.10), 2.55, 3.45)
            rds0 = np.clip(rng.normal(34.0 + lot_rds_shift, 1.80), 28.0, 40.0)
            leak0 = np.clip(rng.lognormal(np.log(38.0 * lot_leakage_factor), 0.22), 12.0, 95.0)
            drain0 = np.clip(rng.normal(16.0 + lot_drain_shift, 0.45), 14.2, 17.8)

            stress_temp = np.clip(
                rng.normal(GENERATOR["stress_temperature_c_mean"], GENERATOR["stress_temperature_c_sd"]),
                119.0, 131.0
            )
            stress_vds = np.clip(
                rng.normal(GENERATOR["stress_vds_v_mean"], GENERATOR["stress_vds_v_sd"]),
                75.0, 85.0
            )
            gate_drive = np.clip(
                rng.normal(GENERATOR["gate_drive_v_mean"], GENERATOR["gate_drive_v_sd"]),
                9.6, 10.4
            )

            direction = int(rng.choice([-1, 1]))
            sudden_start = int(rng.choice([48, 72, 96])) if mode == "SUDDEN_DEGRADATION" else None

            # Correlated per-device offsets across time.
            device_noise = {
                "vth": rng.normal(0, 0.007),
                "rds": rng.normal(0, 0.16),
                "leak": rng.normal(0, 1.20),
                "drain": rng.normal(0, 0.035),
            }

            for hour in GENERATOR["hours"]:
                t = hour / max(GENERATOR["hours"])

                # Healthy ageing + measurement noise.
                vth = vth0 + 0.012*t + device_noise["vth"] + rng.normal(0, 0.006)
                rds = rds0*(1 + 0.012*t) + device_noise["rds"] + rng.normal(0, 0.14)
                leak = leak0*(1 + 0.10*t) + device_noise["leak"] + rng.normal(0, 1.20)
                drain = drain0*(1 - 0.006*t) + device_noise["drain"] + rng.normal(0, 0.045)

                # Inject degradation. These equations are explicit synthetic assumptions.
                if mode == "LEAKAGE_DRIFT":
                    leak += 50*severity*(t**1.4) + 175*severity*(t**3.0)
                    rds += 0.8*severity*(t**2)
                elif mode == "RDS_DRIFT":
                    rds += 4.0*severity*t + 9.5*severity*(t**2)
                    drain -= 0.9*severity*(t**1.5)
                    leak += 14*severity*(t**2)
                elif mode == "VTH_DRIFT":
                    vth += direction*(0.20*severity*t + 0.75*severity*(t**2))
                    leak += 22*severity*(t**2)
                elif mode == "THERMAL_SENSITIVE":
                    thermal_excess = max(stress_temp - 123.0, 0.0)
                    leak += thermal_excess*8.5*severity*(0.25+t) + 120*severity*(t**2.3)
                    rds += thermal_excess*0.20*severity + 6.5*severity*(t**2)
                elif mode == "SUDDEN_DEGRADATION" and hour >= sudden_start:
                    after = (hour - sudden_start + 24) / max(24, (120 - sudden_start + 24))
                    leak += 195*severity*after
                    rds += 11.0*severity*after
                    vth += 0.42*severity*after

                vth = max(vth, 0.1)
                rds = max(rds, 1.0)
                leak = max(leak, 0.01)
                drain = max(drain, 0.1)

                within_demo_bounds = int(
                    SIM_SCREENING_LIMITS["vth_min_v"] <= vth <= SIM_SCREENING_LIMITS["vth_max_v"]
                    and rds <= SIM_SCREENING_LIMITS["rds_on_max_mohm"]
                    and leak <= SIM_SCREENING_LIMITS["idss_demo_limit_ua"]
                )

                rows.append({
                    "component_id": cid,
                    "lot_id": lot_id,
                    "test_hour": int(hour),
                    "stress_temp_c": round(float(stress_temp), 4),
                    "stress_vds_v": round(float(stress_vds), 4),
                    "gate_drive_v": round(float(gate_drive), 4),
                    "vth_v": round(float(vth), 6),
                    "rds_on_mohm": round(float(rds), 6),
                    "idss_leakage_ua": round(float(leak), 6),
                    "drain_current_a": round(float(drain), 6),
                    "true_condition": mode,
                    "is_injected_anomaly": int(abnormal),
                    "within_demo_screening_bounds": within_demo_bounds,
                })

    return pd.DataFrame(rows)

if __name__ == "__main__":
    DATA_DIR.mkdir(exist_ok=True)
    df = generate_dataset()
    out = DATA_DIR / "raw_burnin_data.csv"
    df.to_csv(out, index=False)

    manifest = {
        "seed": SEED,
        "rows": int(len(df)),
        "components": int(df["component_id"].nunique()),
        "lots": int(df["lot_id"].nunique()),
        "hours": GENERATOR["hours"],
        "anomaly_component_rate": float(
            df.groupby("component_id")["is_injected_anomaly"].first().mean()
        ),
    }
    (DATA_DIR / "generation_manifest.json").write_text(json.dumps(manifest, indent=2))
    print(json.dumps(manifest, indent=2))
    print(f"Saved: {out}")
