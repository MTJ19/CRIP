# SIH MOSFET Burn-in ML Prototype — v2

This is the corrected/reproducible version of the prototype.

## What was fixed

1. **Real dataset generator** — `generate_dataset.py` contains the complete synthetic generation logic, including lot variation, noise, healthy ageing, and every injected degradation mode.
2. **One feature definition** — model feature order exists only in `config.py`; the saved `model_bundle.joblib` also stores the exact feature order used at training time.
3. **No true-prevalence contamination setting** — Isolation Forest uses `contamination="auto"`. Its operational threshold is calibrated separately to a 1% false-positive target on known-good validation reference parts.
4. **Validation-derived future-failure threshold** — the classifier threshold is chosen on validation lot L08 using a cost function where a missed bad part costs 5× a false alarm.
5. **Grouped cross-validation** — evaluation includes 5-fold `GroupKFold` by manufacturing lot and reports mean/std, not only one split.
6. **Raw-input inference** — `predict.py` accepts raw component history + raw lot context and performs feature engineering internally.
7. **No silent `fillna(0)`** — missing baselines, NaNs, duplicate measurements, too-small lot context, or zero lot variance cause a clear `DATA_QUALITY_ERROR`.
8. **Less lot-shift sensitivity** — the anomaly model uses only drift and lot-relative features, not absolute raw measurement levels.
9. **Pinned environment** — `requirements.txt` pins the exact package versions used to create the `.joblib` bundle.
10. **Visible domain caveat** — datasheet specifications and synthetic simulation assumptions are kept separate in `config.py`, this README, and metadata.

## Dataset design

- Component: **IRF540N N-channel power MOSFET**
- 10 manufacturing lots
- 500 components per lot
- 5,000 components
- Measurements at 0, 24, 48, 72, 96 and 120 hours
- 30,000 raw rows
- Approximately 92% normal and 8% injected degradation cases

Synthetic failure modes:
- `LEAKAGE_DRIFT`
- `RDS_DRIFT`
- `VTH_DRIFT`
- `THERMAL_SENSITIVE`
- `SUDDEN_DEGRADATION`

## Important distinction: datasheet facts vs simulation assumptions

Datasheet-backed reference facts used in the prototype:
- VDS max: 100 V
- VGS(th) range: 2–4 V
- RDS(on) max: 44 mΩ under the datasheet's stated test condition

Source:
https://www.infineon.com/assets/row/public/documents/24/49/infineon-irf540n-datasheet-en.pdf

The following are **synthetic assumptions**, not manufacturer measurements:
- lot-to-lot shifts
- baseline distributions
- noise sizes
- failure prevalence
- degradation equations/rates
- sudden-degradation onset
- the 250 µA leakage demo screening line

Do not present synthetic accuracy as real industrial qualification accuracy.

## Run from scratch

```bash
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python generate_dataset.py
python preprocess.py
python train.py
python predict.py
```

## Files

```text
sih_mosfet_ml_v2/
├── config.py
├── generate_dataset.py
├── features.py
├── preprocess.py
├── train.py
├── predict.py
├── requirements.txt
├── README.md
├── data/
│   ├── raw_burnin_data.csv
│   ├── features_72h.csv
│   └── generation_manifest.json
├── models/
│   ├── model_bundle.joblib
│   └── metadata.json
└── reports/
    ├── evaluation.json
    └── test_predictions.csv
```

## Train / validation / test policy

- Training lots: L01–L07
- Validation lot: L08
- Final holdout test lots: L09–L10

The holdout test lots are not used to choose thresholds.

In addition, `train.py` runs 5-fold grouped cross-validation by `lot_id` so the project reports stability across unseen manufacturing lots.

## Inference contract

A single MOSFET cannot have a meaningful **lot-relative** z-score without its lot context.

Therefore `predict_from_raw()` explicitly expects:
1. that component's hour-0 and hour-72 raw readings; and
2. the hour-72 snapshot of its lot (minimum 30 components).

If lot context is absent or broken, the API returns `DATA_QUALITY_ERROR` instead of pretending missing information is normal.

## SIH-safe claim

> We built an engineering-inspired synthetic proof of concept to validate an end-to-end anomaly and early-drift pipeline. The code is reproducible and designed to be recalibrated on real manufacturer burn-in data; the synthetic degradation rates are not claimed as production failure statistics.
