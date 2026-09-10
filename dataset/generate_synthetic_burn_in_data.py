"""
Synthetic Burn-In / Screening Data Generator — SIH26170 (Component Reliability Intelligence Platform)

Implements README Sections 7 (schema), 8 (failure modes), 9 (generation methodology),
and 10 (validation) for the MVP synthetic dataset.

IMPORTANT — READ THIS BEFORE USING THE OUTPUT:
- This is SYNTHETIC data. It is NOT real ISRO or real component data.
- All numeric parameter ranges, drift magnitudes, noise levels, and the Arrhenius-style
  temperature scaling constant below are [ASSUMED — TO BE VALIDATED]. They were chosen to be
  *physically plausible* (grounded in general reliability-engineering principles: the bathtub
  curve, lot/unit variation, temperature-accelerated degradation), not sourced from any real
  ISRO specification.
- Checkpoints are fixed at 0h, 24h, 96h, 168h to match the SIH26170 framing described in the
  project README (Section 2) — confirm this against the official PS PDF.

Usage:
    python generate_synthetic_burn_in_data.py --n_lots 40 --components_per_lot 60 --seed 42
"""

import argparse
import numpy as np
import pandas as pd

CHECKPOINTS = [0, 24, 96, 168]  # hours

# ---------------------------------------------------------------------------
# Failure mode taxonomy (README Section 8)
# Target proportions are a MODELING CHOICE [ASSUMED — TO BE VALIDATED], chosen to mirror
# the kind of severe class imbalance seen in real reliability/manufacturing QA data
# (e.g. the widely-cited UCI SECOM dataset has roughly a 1:14 fail:pass ratio).
# ---------------------------------------------------------------------------
FAILURE_MODES = {
    "normal": 0.80,
    "gradual_degradation": 0.06,
    "accelerating_degradation": 0.03,
    "sudden_failure": 0.02,
    "intermittent_anomaly": 0.02,
    "lot_relative_anomaly": 0.05,
    "measurement_anomaly": 0.015,
    "missing_invalid": 0.005,
}
assert abs(sum(FAILURE_MODES.values()) - 1.0) < 1e-9

SEVERITY_BY_MODE = {
    "normal": "none",
    "gradual_degradation": "low",
    "accelerating_degradation": "medium",
    "sudden_failure": "critical",
    "intermittent_anomaly": "medium",
    "lot_relative_anomaly": "medium",
    "measurement_anomaly": "low",       # not a true health issue — a sensor artifact
    "missing_invalid": "unknown",
}

# True anomaly ground truth: everything except "normal" and pure sensor noise is a real
# reliability concern. Measurement anomalies are deliberately NOT counted as true component
# anomalies — they exist to test whether the detector can tell a sensor glitch apart from
# genuine drift (README Section 8, row 7).
TRUE_ANOMALY_MODES = {
    "gradual_degradation", "accelerating_degradation", "sudden_failure",
    "intermittent_anomaly", "lot_relative_anomaly",
}


def make_rng(seed):
    return np.random.default_rng(seed)


def sample_stress_conditions(rng, n_lots):
    """Each lot is tested under one stress condition (temperature, voltage, stress level)."""
    temperature = rng.choice([85, 100, 125, 150], size=n_lots)     # degC, common burn-in temps
    voltage = rng.normal(loc=5.0, scale=0.3, size=n_lots).round(2)  # arbitrary supply voltage
    stress_level = rng.choice(["nominal", "elevated", "high"], size=n_lots, p=[0.5, 0.35, 0.15])
    return temperature, voltage, stress_level


def arrhenius_acceleration(temperature_c, ref_temp_c=85.0, ea_over_k=4500.0):
    """
    Simple Arrhenius-style acceleration factor relative to a reference temperature.
    ea_over_k (Ea/k, in Kelvin) is a chosen illustrative constant — NOT a sourced value for
    any specific real component. [ASSUMED — TO BE VALIDATED]
    Higher temperature -> higher acceleration factor -> faster degradation.
    """
    t_k = temperature_c + 273.15
    ref_k = ref_temp_c + 273.15
    return np.exp(ea_over_k * (1.0 / ref_k - 1.0 / t_k))


def generate_trajectory(rng, baseline, failure_mode, accel_factor, checkpoints=CHECKPOINTS):
    """
    Generate the TRUE (pre-noise) trajectory for one component across all checkpoints,
    given its failure mode. Returns a dict {checkpoint_hour: value}.
    """
    t = np.array(checkpoints, dtype=float)
    max_t = t[-1]

    if failure_mode == "normal":
        # Small, stable, physically-plausible wander — no systematic drift.
        drift = rng.normal(0, baseline * 0.01, size=len(t)).cumsum() * 0.3
        values = baseline + drift

    elif failure_mode == "gradual_degradation":
        # Linear drift, scaled by thermal acceleration factor.
        total_drift = baseline * rng.uniform(0.15, 0.35) * accel_factor
        values = baseline + (t / max_t) * total_drift

    elif failure_mode == "accelerating_degradation":
        # Power-law / exponential-ish drift: slow start, steep finish.
        total_drift = baseline * rng.uniform(0.25, 0.55) * accel_factor
        power = rng.uniform(1.8, 2.6)
        values = baseline + ((t / max_t) ** power) * total_drift

    elif failure_mode == "sudden_failure":
        # Flat, then a sharp step at a random checkpoint (not the first).
        jump_idx = rng.integers(1, len(t))
        jump_size = baseline * rng.uniform(0.6, 1.4)
        values = np.full(len(t), baseline, dtype=float)
        values[jump_idx:] += jump_size

    elif failure_mode == "intermittent_anomaly":
        # Mostly normal, one checkpoint spikes then reverts.
        values = baseline + rng.normal(0, baseline * 0.01, size=len(t)).cumsum() * 0.3
        spike_idx = rng.integers(1, len(t) - 1) if len(t) > 2 else 1
        values[spike_idx] += baseline * rng.uniform(0.4, 0.9) * rng.choice([-1, 1])

    elif failure_mode == "lot_relative_anomaly":
        # Individually smooth/plausible trajectory, but SHIFTED from its lot's baseline.
        # This is the core case SIH26170 is asking the system to catch.
        offset = baseline * rng.uniform(0.20, 0.45) * rng.choice([-1, 1], p=[0.15, 0.85])
        drift = rng.normal(0, baseline * 0.01, size=len(t)).cumsum() * 0.3
        values = (baseline + offset) + drift

    elif failure_mode == "measurement_anomaly":
        # Underlying health is normal; ONE reading is a sensor glitch unrelated to true state.
        # The glitch is an extreme statistical outlier but stays physically valid (non-negative),
        # since a real sensor fault (e.g. saturation, calibration slip) rarely reports an
        # impossible negative value for a strictly-positive parameter.
        values = baseline + rng.normal(0, baseline * 0.01, size=len(t)).cumsum() * 0.3
        glitch_idx = rng.integers(0, len(t))
        values[glitch_idx] = max(baseline * rng.uniform(2.0, 3.5), baseline * 0.05)

    elif failure_mode == "missing_invalid":
        values = baseline + rng.normal(0, baseline * 0.01, size=len(t)).cumsum() * 0.3

    else:
        raise ValueError(f"Unknown failure mode: {failure_mode}")

    # Safety clip: the parameter is treated as strictly non-negative (e.g. a leakage current /
    # resistance-like magnitude). No failure mode should be able to produce a physically
    # impossible negative TRUE value, even in the tails of the sampled distributions.
    values = np.clip(values, a_min=baseline * 0.01, a_max=None)

    return {int(cp): float(v) for cp, v in zip(checkpoints, values)}


def generate_dataset(n_lots=40, components_per_lot=60, seed=42,
                      component_type="Discrete_Transistor_X",
                      global_baseline_mean=250.0, global_baseline_std=25.0,
                      missing_rate_extra=0.01, measurement_noise_frac=0.02):
    rng = make_rng(seed)

    temperature, voltage, stress_level = sample_stress_conditions(rng, n_lots)

    rows = []
    for lot_idx in range(n_lots):
        lot_id = f"LOT-{lot_idx:03d}"
        lot_temp = temperature[lot_idx]
        lot_volt = voltage[lot_idx]
        lot_stress = stress_level[lot_idx]

        # Lot-to-lot variation: each lot's own baseline is offset from the global population mean.
        lot_baseline = rng.normal(global_baseline_mean, global_baseline_std * 0.6)
        accel = arrhenius_acceleration(lot_temp)

        # Assign failure modes to this lot's components according to target proportions.
        modes = list(FAILURE_MODES.keys())
        probs = list(FAILURE_MODES.values())
        n_comp = components_per_lot
        assigned_modes = rng.choice(modes, size=n_comp, p=probs)

        for comp_idx in range(n_comp):
            component_id = f"{lot_id}-C{comp_idx:04d}"
            failure_mode = assigned_modes[comp_idx]

            # Component-to-component variation within the lot (log-normal keeps values positive
            # and reflects typical manufacturing-tolerance skew).
            comp_baseline = lot_baseline * rng.lognormal(mean=0.0, sigma=0.04)

            true_traj = generate_trajectory(rng, comp_baseline, failure_mode, accel)

            # Measurement noise layered on top of the true trajectory (instrument noise,
            # separate from real degradation).
            noisy_traj = {}
            for cp, val in true_traj.items():
                noise = rng.normal(0, abs(val) * measurement_noise_frac)
                noisy_traj[cp] = max(val + noise, 0.0)

            row = {
                "Component_ID": component_id,
                "Lot_ID": lot_id,
                "Component_Type": component_type,
                "Temperature": float(lot_temp),
                "Voltage": float(lot_volt),
                "Stress_Level": lot_stress,
                "Parameter_0h": noisy_traj[0],
                "Parameter_24h": noisy_traj[24],
                "Parameter_96h": noisy_traj[96],
                "Parameter_168h": noisy_traj[168],
                "Anomaly_Label": failure_mode in TRUE_ANOMALY_MODES,
                "Failure_Mode": failure_mode,
                "Severity": SEVERITY_BY_MODE[failure_mode],
            }

            # Missing-data simulation: randomly null out a checkpoint (beyond the dedicated
            # missing_invalid class, a small extra background missingness rate is applied
            # to every component, matching real sensor dropout).
            for cp_col in ["Parameter_0h", "Parameter_24h", "Parameter_96h", "Parameter_168h"]:
                if rng.random() < missing_rate_extra:
                    row[cp_col] = np.nan
            if failure_mode == "missing_invalid":
                n_missing = rng.integers(1, 3)
                cols = rng.choice(
                    ["Parameter_0h", "Parameter_24h", "Parameter_96h", "Parameter_168h"],
                    size=n_missing, replace=False,
                )
                for c in cols:
                    row[c] = np.nan

            rows.append(row)

    df = pd.DataFrame(rows)

    # ---- Engineered features (Section 7) ----
    df["Drift_0_24"] = df["Parameter_24h"] - df["Parameter_0h"]
    df["Drift_24_96"] = df["Parameter_96h"] - df["Parameter_24h"]
    df["Drift_96_168"] = df["Parameter_168h"] - df["Parameter_96h"]

    for cp_col, mean_col, std_col, z_col in [
        ("Parameter_168h", "Lot_Mean", "Lot_STD", "Lot_ZScore"),
    ]:
        lot_stats = df.groupby("Lot_ID")[cp_col].agg(["mean", "std"])
        df = df.merge(lot_stats, left_on="Lot_ID", right_index=True, how="left")
        df.rename(columns={"mean": mean_col, "std": std_col}, inplace=True)
        df[z_col] = (df[cp_col] - df[mean_col]) / df[std_col]

    # Ground truth for drift-prediction evaluation; model-output placeholders left blank —
    # these are OUTPUTS, never inputs, and are populated later by the trained models, not by
    # the data generator.
    df["Actual_168h"] = df["Parameter_168h"]
    df["Predicted_168h"] = np.nan
    df["Final_Status"] = None

    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n_lots", type=int, default=40)
    parser.add_argument("--components_per_lot", type=int, default=60)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--out", type=str, default="/home/claude/data/synthetic/burn_in_synthetic_v1.csv")
    args = parser.parse_args()

    df = generate_dataset(n_lots=args.n_lots, components_per_lot=args.components_per_lot, seed=args.seed)
    df.to_csv(args.out, index=False)
    print(f"Generated {len(df)} rows across {df['Lot_ID'].nunique()} lots -> {args.out}")
    print(df["Failure_Mode"].value_counts(normalize=True).round(4))
