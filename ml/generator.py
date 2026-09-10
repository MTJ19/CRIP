import pandas as pd
import numpy as np
import random
from typing import List, Dict

# ASSUMED — TO BE VALIDATED parameters
NUM_LOTS = 10
COMPONENTS_PER_LOT = 500

# Base parameters
BASELINE_VALUE_MEAN = 200.0
BASELINE_VALUE_STD = 20.0
INSTRUMENT_NOISE_STD = 2.0

# Degradation parameters
GRADUAL_DRIFT_MEAN = 5.0
GRADUAL_DRIFT_STD = 2.0
ACCELERATING_MULT = 1.5

def generate_lot(lot_id: str, component_type: str) -> pd.DataFrame:
    records = []
    
    # Lot-level variation (shift the entire lot slightly)
    lot_offset = np.random.normal(0, 10.0)
    
    for c in range(COMPONENTS_PER_LOT):
        comp_id = f"{lot_id}_C{c:03d}"
        
        # Base physical component variance
        base_val = np.random.normal(BASELINE_VALUE_MEAN, BASELINE_VALUE_STD) + lot_offset
        
        # Stress conditions
        temp = np.random.choice([25.0, 85.0, 125.0])
        volt = np.random.choice([3.3, 5.0, 12.0])
        stress_level = "High" if temp >= 125.0 else ("Medium" if temp == 85.0 else "Low")
        
        # Choose failure mode (Section 8)
        # 1: Normal (80%)
        # 2: Gradual (10%)
        # 3: Accelerating (3%)
        # 4: Sudden (2%)
        # 5: Intermittent (2%)
        # 6: Lot-relative anomaly (3%)
        
        mode_prob = random.random()
        anomaly_label = False
        failure_mode = "Normal"
        severity = "None"
        
        t0_val = base_val + np.random.normal(0, INSTRUMENT_NOISE_STD)
        t24_val = t0_val + np.random.normal(0, INSTRUMENT_NOISE_STD)
        t96_val = t24_val + np.random.normal(0, INSTRUMENT_NOISE_STD)
        t168_val = t96_val + np.random.normal(0, INSTRUMENT_NOISE_STD)
        
        if mode_prob < 0.10:
            failure_mode = "Gradual"
            anomaly_label = True
            severity = "Medium"
            drift_rate = max(1.0, np.random.normal(GRADUAL_DRIFT_MEAN, GRADUAL_DRIFT_STD))
            if temp == 125.0: drift_rate *= 1.5 # Arrhenius-style acceleration
            t24_val += drift_rate * 1
            t96_val += drift_rate * 4
            t168_val += drift_rate * 7
            
        elif mode_prob < 0.13:
            failure_mode = "Accelerating"
            anomaly_label = True
            severity = "High"
            base_drift = 2.0
            t24_val += base_drift
            t96_val += base_drift * 3
            t168_val += base_drift * 8 # sharp increase at the end
            
        elif mode_prob < 0.15:
            failure_mode = "Sudden"
            anomaly_label = True
            severity = "Critical"
            jump = 50.0
            if random.random() < 0.5:
                t96_val += jump
                t168_val += jump
            else:
                t168_val += jump
                
        elif mode_prob < 0.17:
            failure_mode = "Intermittent"
            anomaly_label = True
            severity = "Medium"
            spike = 30.0
            checkpoint = random.choice(['24', '96'])
            if checkpoint == '24': t24_val += spike
            else: t96_val += spike
            
        elif mode_prob < 0.20:
            failure_mode = "Lot-relative anomaly"
            anomaly_label = True
            severity = "Medium"
            # Component follows normal trajectory but starts significantly offset from lot
            t0_val += 45.0
            t24_val += 45.0
            t96_val += 45.0
            t168_val += 45.0
        
        # Missing data injection (2% overall)
        if random.random() < 0.02: t24_val = np.nan
        if random.random() < 0.02: t96_val = np.nan
        if random.random() < 0.02: t168_val = np.nan

        records.append({
            "Component_ID": comp_id,
            "Lot_ID": lot_id,
            "Component_Type": component_type,
            "Temperature": temp,
            "Voltage": volt,
            "Stress_Level": stress_level,
            "Parameter_0h": t0_val,
            "Parameter_24h": t24_val,
            "Parameter_96h": t96_val,
            "Parameter_168h": t168_val,
            "Anomaly_Label": anomaly_label,
            "Failure_Mode": failure_mode,
            "Severity": severity,
            "Actual_168h": t168_val # Same as Parameter_168h initially, but separates concept for drift model ground truth
        })
        
    df = pd.DataFrame(records)
    
    # Compute lot-level engineered features
    df['Lot_Mean'] = df[['Parameter_0h', 'Parameter_24h', 'Parameter_96h', 'Parameter_168h']].mean(axis=1).mean()
    df['Lot_STD'] = df[['Parameter_0h', 'Parameter_24h', 'Parameter_96h', 'Parameter_168h']].mean(axis=1).std()
    
    # Basic Feature engineering
    df['Drift_0_24'] = df['Parameter_24h'] - df['Parameter_0h']
    df['Drift_24_96'] = df['Parameter_96h'] - df['Parameter_24h']
    df['Drift_96_168'] = df['Parameter_168h'] - df['Parameter_96h']
    
    # robust Z-score on 168h for MVP
    df['Lot_ZScore'] = (df['Parameter_168h'] - df['Lot_Mean']) / df['Lot_STD']
    
    return df

def generate_dataset(output_path: str):
    print("Generating synthetic dataset...")
    all_lots = []
    for i in range(NUM_LOTS):
        lot_id = f"LOT_2026_{i:02d}"
        print(f"  Generating {lot_id}...")
        df = generate_lot(lot_id, "MOSFET_N_CH")
        all_lots.append(df)
        
    full_df = pd.concat(all_lots, ignore_index=True)
    full_df.to_csv(output_path, index=False)
    print(f"Dataset generated at {output_path} with {len(full_df)} records.")

if __name__ == "__main__":
    generate_dataset("synthetic_burnin_data.csv")
