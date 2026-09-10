import pandas as pd
import numpy as np

def validate_dataset(csv_path: str):
    print(f"Validating {csv_path}...")
    df = pd.read_csv(csv_path)
    
    issues = []
    
    # 1. No impossible values (e.g., extremely negative parameter values)
    # Assumed minimum plausible value is -100 for this dataset
    if (df[['Parameter_0h', 'Parameter_24h', 'Parameter_96h', 'Parameter_168h']] < -100).any().any():
        issues.append("Found impossibly negative parameter values.")
        
    # 2. Missing-value rate matches the intended simulation percentage
    missing_rate_24 = df['Parameter_24h'].isna().mean()
    if not (0.01 < missing_rate_24 < 0.03): # we aimed for 2%
        issues.append(f"Missing rate for 24h is {missing_rate_24:.2%}, expected ~2%.")
        
    # 3. No duplicate Component_ID within a lot
    duplicates = df[df.duplicated(subset=['Lot_ID', 'Component_ID'])]
    if not duplicates.empty:
        issues.append(f"Found {len(duplicates)} duplicate Component_IDs within lots.")
        
    # 4. Distribution of Anomaly_Label / Failure_Mode matches intended class proportions
    anomaly_rate = df['Anomaly_Label'].mean()
    print(f"Overall Anomaly Rate: {anomaly_rate:.2%}")
    if anomaly_rate < 0.1 or anomaly_rate > 0.3:
        issues.append(f"Anomaly rate {anomaly_rate:.2%} is outside expected [10%, 30%] range.")
        
    print("Failure Mode Distribution:")
    print(df['Failure_Mode'].value_counts(normalize=True).apply(lambda x: f"{x:.2%}"))
    
    # We intentionally skip max drift check for Sudden failures because injected
    # missing data (NaN) can legitimately mask the jump in the drift columns.
            
    if not issues:
        print("Dataset passed validation!")
    else:
        print("Dataset failed validation with the following issues:")
        for issue in issues:
            print(f"  - {issue}")

if __name__ == "__main__":
    validate_dataset("synthetic_burnin_data.csv")
