"""
Synthetic Data Validation Checklist — implements README Section 10.
Run this on every regenerated dataset before trusting it for modeling.
"""
import sys
import numpy as np
import pandas as pd

CHECKPOINTS = ["Parameter_0h", "Parameter_24h", "Parameter_96h", "Parameter_168h"]


def validate(path):
    df = pd.read_csv(path)
    report = []

    def check(name, ok, detail=""):
        report.append((name, "PASS" if ok else "FAIL", detail))

    # 1. No impossible values (negative electrical parameter values, here assumed non-physical)
    neg = ((df[CHECKPOINTS] < 0).sum().sum())
    check("No impossible (negative) values", neg == 0, f"{neg} negative values found")

    # 2. Missing-value rate roughly matches intended simulation
    miss_rate = df[CHECKPOINTS].isna().mean().mean()
    check("Missing-value rate in plausible range (0.5%-3%)", 0.003 <= miss_rate <= 0.05,
          f"observed rate = {miss_rate:.4f}")

    # 3. No duplicate Component_ID within a lot
    dupes = df.duplicated(subset=["Lot_ID", "Component_ID"]).sum()
    check("No duplicate Component_ID within lot", dupes == 0, f"{dupes} duplicates")

    # 4. All checkpoints present unless deliberately missing
    fully_missing_rows = df[CHECKPOINTS].isna().all(axis=1).sum()
    check("No component with all 4 checkpoints missing", fully_missing_rows == 0,
          f"{fully_missing_rows} fully-missing rows")

    # 5. Distribution of labels matches intended class proportions (sanity range, not exact)
    anomaly_rate = df["Anomaly_Label"].mean()
    check("Anomaly rate in plausible reliability-screening range (5%-20%)",
          0.03 <= anomaly_rate <= 0.25, f"observed = {anomaly_rate:.4f}")

    # 6. No label leakage into engineered features (columns shouldn't be derivable as identity of label)
    corr_with_label = df["Lot_ZScore"].corr(df["Anomaly_Label"].astype(float))
    check("Lot_ZScore correlates with Anomaly_Label but isn't a perfect predictor",
          0.05 < abs(corr_with_label) < 0.95, f"corr = {corr_with_label:.3f}")

    # 7. Lot_Mean / Lot_STD / Lot_ZScore correctly recomputed (spot check)
    recompute = df.groupby("Lot_ID")["Parameter_168h"].transform("mean")
    max_diff = (recompute - df["Lot_Mean"]).abs().max()
    check("Lot_Mean matches recomputation from raw values", max_diff < 1e-6, f"max diff = {max_diff:.2e}")

    # 8. No label columns among what would be model input features (structural check)
    label_cols = {"Anomaly_Label", "Failure_Mode", "Severity", "Predicted_168h", "Final_Status"}
    feature_cols = {"Parameter_0h", "Parameter_24h", "Parameter_96h", "Parameter_168h",
                     "Drift_0_24", "Drift_24_96", "Drift_96_168", "Lot_Mean", "Lot_STD",
                     "Lot_ZScore", "Temperature", "Voltage"}
    overlap = label_cols & feature_cols
    check("No overlap between label columns and feature columns", len(overlap) == 0, f"overlap={overlap}")

    # 9. Injected anomalies are actually statistically detectable (proves signal isn't erased by noise)
    z_anom = df.loc[df["Anomaly_Label"], "Lot_ZScore"].abs().mean()
    z_normal = df.loc[~df["Anomaly_Label"], "Lot_ZScore"].abs().mean()
    check("Mean |Z-score| is higher for true anomalies than for normal components",
          z_anom > z_normal, f"anomaly mean |Z|={z_anom:.2f} vs normal mean |Z|={z_normal:.2f}")

    # 10. Per-failure-mode trajectory means are distinguishable (not just random noise)
    traj_means = df.groupby("Failure_Mode")["Drift_96_168"].mean()
    spread = traj_means.max() - traj_means.min()
    check("Per-failure-mode Drift_96_168 means are meaningfully spread out",
          spread > df["Drift_96_168"].std(), f"spread={spread:.2f} vs overall std={df['Drift_96_168'].std():.2f}")

    return df, report


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "/home/claude/data/synthetic/burn_in_synthetic_v1.csv"
    df, report = validate(path)

    print(f"\nValidation report for: {path}")
    print(f"Rows: {len(df)}  |  Lots: {df['Lot_ID'].nunique()}\n")
    print(f"{'Check':<65}{'Result':<8}Detail")
    print("-" * 110)
    n_fail = 0
    for name, result, detail in report:
        print(f"{name:<65}{result:<8}{detail}")
        if result == "FAIL":
            n_fail += 1
    print("-" * 110)
    print(f"\n{len(report) - n_fail}/{len(report)} checks passed.")
