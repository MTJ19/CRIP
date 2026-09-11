import { Lot } from '../data/demoLots';
import { ComponentDetails } from '../data/demoComponents';
import { getLatestDashboardAnalysisFromSupabase, isSupabaseConfigured } from '../lib/supabase';

const API_BASE = 'http://localhost:8000/api';

export const api = {
  getLots: async (): Promise<Lot[]> => {
    const res = await fetch(`${API_BASE}/lots`);
    if (!res.ok) throw new Error("Failed to fetch lots");
    const data = await res.json();
    return data.lots.map((l: any) => ({
      id: l.lotId,
      componentType: l.componentType,
      totalComponents: l.totalComponents,
      checkpoint: l.checkpoint || '72h',
      anomalyRate: l.anomalyRate,
      anomaliesCount: l.anomalyCount,
      highRiskCount: l.highCount,
      criticalRiskCount: l.criticalCount,
      status: 'ANALYZED'
    }));
  },

  getDashboardSummary: async () => {
    const res = await fetch(`${API_BASE}/dashboard/summary`);
    if (!res.ok) throw new Error("Failed to fetch dashboard summary");
    return await res.json();
  },

  getLot: async (lotId: string): Promise<Lot | undefined> => {
    const lots = await api.getLots();
    const found = lots.find(l => l.id === lotId);
    return found || lots[0];
  },

  getComponents: async (lotId: string): Promise<ComponentDetails[]> => {
    const res = await fetch(`${API_BASE}/lots/${lotId}/components`);
    if (!res.ok) throw new Error("Failed to fetch components");
    const data = await res.json();
    return data.components.map((c: any) => ({
      id: c.componentId,
      lotId: lotId,
      type: 'IRF540N Power MOSFET',
      absoluteSpec: c.risk === 'CRITICAL' ? 'FAIL' : 'PASS',
      lotRelativeBehaviour: c.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
      zScore: c.lotZScore || 0,
      anomalyScore: c.anomalyScore || (c.isAnomalous ? 0.85 : 0.05),
      drift: c.drift || 0,
      predicted168h: c.predicted168h || 34.0,
      risk: c.risk || 'LOW',
      status: c.failureMode || 'Normal',
      reasons: c.reasons
    })).sort((a: any, b: any) => b.anomalyScore - a.anomalyScore);
  },

  getComponent: async (compId: string, lotId?: string): Promise<ComponentDetails | undefined> => {
    try {
      let res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) {
        const lots = await api.getLots();
        if (lots.length > 0) {
          const comps = await api.getComponents(lots[0].id);
          if (comps.length > 0) {
            res = await fetch(`${API_BASE}/components/${comps[0].id}`);
          }
        }
      }
      if (!res.ok) throw new Error("Failed to fetch component");
      const c = await res.json();
      return {
        id: c.componentId,
        lotId: c.lotId,
        type: c.componentType,
        absoluteSpec: c.status.severity === 'CRITICAL' ? 'FAIL' : 'PASS',
        lotRelativeBehaviour: c.status.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
        zScore: c.lotRelativeZScores?.rds_z || 0,
        anomalyScore: c.status.futureProbability || (c.status.isAnomalous ? 0.85 : 0.05),
        drift: c.measurementsAt72h?.rds_on_mohm ? (c.measurementsAt72h.rds_on_mohm - 33.5) : 0,
        predicted168h: c.measurementsAt72h?.rds_on_mohm || 34.0,
        risk: c.status.severity || 'LOW',
        status: c.status.failureMode || 'NORMAL'
      };
    } catch {
      return undefined;
    }
  },

  getTrajectory: async (compId: string, lotId?: string) => {
    try {
      let res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) {
        const lots = await api.getLots();
        if (lots.length > 0) {
          const comps = await api.getComponents(lots[0].id);
          if (comps.length > 0) {
            res = await fetch(`${API_BASE}/components/${comps[0].id}`);
          }
        }
      }
      if (!res.ok) throw new Error("Failed to fetch trajectory");
      const data = await res.json();
      
      return data.trajectory.map((t: any) => {
        const timeVal = parseInt(t.checkpoint.replace('h', ''));
        const isPredicted = timeVal > 72;
        
        return {
          time: t.checkpoint,
          value: isPredicted ? null : t.value,
          predictedValue: isPredicted ? t.value : null,
          lotAverage: data.lotBaseline ? (data.lotBaseline[t.checkpoint] || 33.8) : null,
          safetyBoundary: 44.0 // Datasheet RDS(on) max spec limit
        };
      });
    } catch {
      return [];
    }
  },
  
  uploadDataset: async (file: File) => {
    return await api.analyzeCSV(file);
  },

  loadSampleDataset: async () => {
    return await api.analyzeSample();
  },

  analyzeCSV: async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Upload failed` }));
      throw new Error(err.detail || "Upload analysis failed");
    }
    return await res.json();
  },

  analyzeSample: async () => {
    const res = await fetch(`${API_BASE}/analyze?use_sample=true`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Failed to load sample` }));
      throw new Error(err.detail || "Failed to load sample dataset");
    }
    return await res.json();
  },

  getAnalysis: async (analysisId: string) => {
    // 1. If Supabase client is configured, query Supabase tables directly
    if (isSupabaseConfigured()) {
      try {
        const supabaseData = await getLatestDashboardAnalysisFromSupabase(analysisId);
        if (supabaseData) {
          return supabaseData;
        }
      } catch (e) {
        console.warn("Direct Supabase query failed, falling back to backend API:", e);
      }
    }

    // 2. Fetch from backend API (which also queries persistent database)
    const res = await fetch(`${API_BASE}/analyze/${analysisId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Analysis not found` }));
      throw new Error(err.detail || "Failed to fetch analysis");
    }
    return await res.json();
  },

  getModelRuns: async () => {
    const res = await fetch(`${API_BASE}/db/runs`);
    if (!res.ok) throw new Error("Failed to fetch model runs");
    return await res.json();
  },

  getModelMetrics: async () => {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error("Failed to fetch model evaluation metrics");
    return await res.json();
  },

  getMlMetrics: async () => {
    const res = await fetch(`${API_BASE}/ml/metrics`);
    if (!res.ok) throw new Error("Failed to fetch ML metrics");
    return await res.json();
  },

  predict: async (input: {
    lot_id?: string;
    lotId?: string;
    vth0h?: number;
    vth72h?: number;
    vth_0h?: number;
    vth_target?: number;
    rds0h?: number;
    rds72h?: number;
    rds_0h?: number;
    rds_target?: number;
    idss0h?: number;
    idss72h?: number;
    idss_0h?: number;
    idss_target?: number;
    drain0h?: number;
    drain72h?: number;
    drain_0h?: number;
    drain_target?: number;
    stressTempC?: number;
    stress_temp_c?: number;
    stressVdsV?: number;
    stress_vds_v?: number;
    gateDriveV?: number;
    gate_drive_v?: number;
  }) => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Prediction failed` }));
      throw new Error(err.detail || "Prediction failed");
    }
    return await res.json();
  },

  predictSingle: async (input: any) => {
    return await api.predict(input);
  }
};
