
import pandas as pd
from config import DATA_DIR
from features import build_features

if __name__ == "__main__":
    raw = pd.read_csv(DATA_DIR / "raw_burnin_data.csv")
    feat72 = build_features(raw, target_hour=72)
    out = DATA_DIR / "features_72h.csv"
    feat72.to_csv(out, index=False)
    print(f"Saved {len(feat72)} component-level rows to {out}")
