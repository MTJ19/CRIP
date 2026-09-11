
import pandas as pd
from config import DATA_DIR
from features import build_features, DataQualityError
from predict import predict_from_raw

raw = pd.read_csv(DATA_DIR / "raw_burnin_data.csv")
feat = build_features(raw, 72)
assert len(feat) == 5000
assert feat.isna().sum().sum() == 0

cid = raw["component_id"].iloc[0]
lot = raw.loc[raw.component_id == cid, "lot_id"].iloc[0]
history = raw[(raw.component_id == cid) & (raw.test_hour.isin([0,72]))]
lot72 = raw[(raw.lot_id == lot) & (raw.test_hour == 72)]
result = predict_from_raw(history, lot72)
assert result["status"] == "OK"

broken = history[history.test_hour != 0]
bad = predict_from_raw(broken, lot72)
assert bad["status"] == "DATA_QUALITY_ERROR"

print("All smoke tests passed.")
