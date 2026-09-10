from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import os
import json
import shutil

app = FastAPI(title="CRIP Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for MVP
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "synthetic_burnin_data.csv")

def load_data():
    if not os.path.exists(DATA_FILE):
        raise FileNotFoundError(f"Data file not found at {DATA_FILE}")
    # Read and fill NaNs
    df = pd.read_csv(DATA_FILE)
    if 'Severity' in df.columns:
        df['Severity'] = df['Severity'].fillna("None")
    if 'Failure_Mode' in df.columns:
        df['Failure_Mode'] = df['Failure_Mode'].fillna("Normal")
    return df

@app.post("/api/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        # Save uploaded file over the existing synthetic data
        with open(DATA_FILE, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Validate schema and calculate stats
        df = pd.read_csv(DATA_FILE)
        
        # Calculate validation stats
        total_components = len(df)
        has_lot_id = 'Lot_ID' in df.columns
        has_comp_id = 'Component_ID' in df.columns
        
        # If schema is invalid, we might want to warn
        if not has_lot_id or not has_comp_id:
            raise HTTPException(status_code=400, detail="Missing required columns: Lot_ID or Component_ID")
            
        duplicate_ids = df['Component_ID'].duplicated().sum() if has_comp_id else 0
        missing_values_pct = (df.isnull().sum().sum() / df.size) * 100 if df.size > 0 else 0
        
        # Determine checkpoints dynamically based on column names like 'Parameter_XXh'
        checkpoint_cols = [c for c in df.columns if c.startswith('Parameter_') and c.endswith('h')]
        checkpoints_detected = len(checkpoint_cols)

        return {
            "success": True,
            "filename": file.filename,
            "stats": {
                "schemaValidated": True,
                "componentsDetected": int(total_components),
                "checkpointsDetected": checkpoints_detected,
                "duplicateIds": int(duplicate_ids),
                "missingValues": float(missing_values_pct)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/dashboard/summary")
def get_dashboard_summary():
    try:
        df = load_data()
        
        total_lots = df['Lot_ID'].nunique()
        total_components = len(df)
        
        anomalies = df[df['Anomaly_Label'] == True]
        total_anomalies = len(anomalies)
        anomaly_rate = total_anomalies / total_components if total_components > 0 else 0
        
        high_risk = len(df[df['Severity'] == 'High'])
        critical_risk = len(df[df['Severity'] == 'Critical'])
        
        # Risk Distribution
        risk_dist = df['Severity'].value_counts().to_dict()
        
        # Failure Mode Distribution (for anomalies)
        failure_modes = anomalies['Failure_Mode'].value_counts().to_dict()
        
        return {
            "metrics": {
                "totalLots": total_lots,
                "totalComponents": total_components,
                "totalAnomalies": total_anomalies,
                "anomalyRate": float(anomaly_rate),
                "highRiskCount": high_risk,
                "criticalRiskCount": critical_risk
            },
            "riskDistribution": [{"name": k, "value": int(v)} for k, v in risk_dist.items()],
            "failureModeDistribution": [{"name": k, "value": int(v)} for k, v in failure_modes.items()]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lots")
def get_lots():
    try:
        df = load_data()
        
        # Group by lot and calculate aggregates
        lots_data = []
        for lot_id, group in df.groupby('Lot_ID'):
            total = len(group)
            anomalies = group['Anomaly_Label'].sum()
            critical = len(group[group['Severity'] == 'Critical'])
            high = len(group[group['Severity'] == 'High'])
            
            lots_data.append({
                "lotId": lot_id,
                "componentType": group['Component_Type'].iloc[0],
                "totalComponents": int(total),
                "anomalyCount": int(anomalies),
                "anomalyRate": float(anomalies / total),
                "criticalCount": int(critical),
                "highCount": int(high)
            })
            
        return {"lots": lots_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/lots/{lot_id}/components")
def get_lot_components(lot_id: str):
    try:
        df = load_data()
        lot_df = df[df['Lot_ID'] == lot_id]
        
        if lot_df.empty:
            raise HTTPException(status_code=404, detail="Lot not found")
            
        components = []
        for _, row in lot_df.iterrows():
            components.append({
                "componentId": row['Component_ID'],
                "isAnomalous": bool(row['Anomaly_Label']),
                "severity": row['Severity'],
                "failureMode": row['Failure_Mode'],
                "lotZScore": float(row['Lot_ZScore']) if pd.notna(row['Lot_ZScore']) else 0.0,
                "drift_168h": float(row['Drift_96_168']) if pd.notna(row['Drift_96_168']) else 0.0,
            })
            
        return {"components": components}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/components/{component_id}")
def get_component(component_id: str):
    try:
        df = load_data()
        comp_df = df[df['Component_ID'] == component_id]
        
        if comp_df.empty:
            raise HTTPException(status_code=404, detail="Component not found")
            
        row = comp_df.iloc[0]
        
        trajectory = [
            {"checkpoint": "0h", "value": float(row['Parameter_0h']) if pd.notna(row['Parameter_0h']) else None},
            {"checkpoint": "24h", "value": float(row['Parameter_24h']) if pd.notna(row['Parameter_24h']) else None},
            {"checkpoint": "96h", "value": float(row['Parameter_96h']) if pd.notna(row['Parameter_96h']) else None},
            {"checkpoint": "168h", "value": float(row['Parameter_168h']) if pd.notna(row['Parameter_168h']) else None},
        ]
        
        # Calculate lot baseline for this lot
        lot_df = df[df['Lot_ID'] == row['Lot_ID']]
        lot_means = {
            "0h": float(lot_df['Parameter_0h'].mean()),
            "24h": float(lot_df['Parameter_24h'].mean()),
            "96h": float(lot_df['Parameter_96h'].mean()),
            "168h": float(lot_df['Parameter_168h'].mean())
        }
        
        return {
            "componentId": row['Component_ID'],
            "lotId": row['Lot_ID'],
            "componentType": row['Component_Type'],
            "stressConditions": {
                "temperature": float(row['Temperature']),
                "voltage": float(row['Voltage']),
                "level": row['Stress_Level']
            },
            "status": {
                "isAnomalous": bool(row['Anomaly_Label']),
                "severity": row['Severity'],
                "failureMode": row['Failure_Mode'],
                "lotZScore": float(row['Lot_ZScore']) if pd.notna(row['Lot_ZScore']) else 0.0
            },
            "trajectory": trajectory,
            "lotBaseline": lot_means
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
