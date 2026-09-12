import { Lot } from '../data/demoLots';
import { ComponentDetails } from '../data/demoComponents';
import { getLatestDashboardAnalysisFromSupabase, isSupabaseConfigured } from '../lib/supabase';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface AnalysisComponent {
  component_id: string;
  lot_id: string;
  risk_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | string;
  is_anomaly: boolean;
  anomaly_risk_score: number;
  future_failure_probability: number;
  predicted_future_failure: boolean;
  rds_on_mohm: number;
  idss_leakage_ua: number;
  vth_v: number;
  drain_current_a: number;
  failure_mode?: string;
  condition?: string;
  main_reason: string;
  recommended_action: string;
  rds_drift_mohm?: number;
}

export interface AnalysisLot {
  lot_id: string;
  total_components: number;
  anomalies_count: number;
  anomaly_rate: number;
  critical_risk_count: number;
  high_risk_count: number;
  predicted_future_failures: number;
  checkpoint?: string;
}

export interface AnalysisAlert {
  id?: string;
  component_id: string;
  lot_id: string;
  risk_level: string;
  main_reason: string;
  recommended_action: string;
  future_failure_probability?: number;
}

export interface AnalysisRecord {
  analysis_id: string;
  model_run_id?: string;
  filename: string;
  run_type?: string;
  timestamp?: string;
  created_at?: string;
  is_synthetic?: boolean;
  summary: {
    total_components: number;
    total_anomalies: number;
    anomaly_rate: number;
    critical_risk_count: number;
    high_risk_count: number;
    medium_risk_count?: number;
    low_risk_count?: number;
    predicted_future_failures: number;
    risk_distribution?: Array<{ name: string; value: number }>;
    failure_mode_distribution?: Array<{ name: string; value: number; count?: number }>;
  };
  lot_breakdown: AnalysisLot[];
  components: AnalysisComponent[];
  alerts: AnalysisAlert[];
  checkpoints_detected?: number[];
  conflicts_count?: number;
  rejected_count?: number;
  rejection_summary?: string[];
  persisted_in_db?: boolean;
}

export interface HistoricalRun {
  id: string;
  analysis_id: string;
  run_type: string;
  source_filename: string;
  triggered_by: string;
  created_at: string;
  total_components: number;
  total_lots: number;
  anomalies_count: number;
  critical_risk_count: number;
  high_risk_count: number;
  status: 'Completed' | 'Processing' | 'Failed';
}

export interface ValidationSummary {
  isValid: boolean;
  totalRecords: number;
  detectedLots: number;
  detectedComponents: number;
  detectedCheckpoints: number[];
  processedCount: number;
  duplicateCount: number;
  conflictingCount: number;
  invalidCount: number;
  missingValuesCount: number;
  columnsFound: string[];
  previewRows: Array<Record<string, string | number>>;
  warnings: string[];
  errors: string[];
}

export const api = {
  checkDatabaseHealth: async (): Promise<{ connected: boolean; status: string; storageType: string }> => {
    try {
      const res = await fetch(`${API_BASE}/db/runs`, { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        return { connected: true, status: 'connected', storageType: 'SQLite / Postgres DB Active' };
      }
      return { connected: false, status: 'error', storageType: 'Backend HTTP Error' };
    } catch {
      if (isSupabaseConfigured()) {
        return { connected: true, status: 'connected', storageType: 'Supabase Cloud Postgres' };
      }
      return { connected: false, status: 'local_storage', storageType: 'Local Session Storage' };
    }
  },

  getHistoricalRuns: async (): Promise<HistoricalRun[]> => {
    try {
      const res = await fetch(`${API_BASE}/db/runs`);
      if (!res.ok) throw new Error("Failed to fetch historical runs");
      const data = await res.json();
      return (data.runs || []).map((r: Record<string, unknown>) => ({
        id: String(r.id || r.analysis_id),
        analysis_id: String(r.analysis_id || r.id),
        run_type: String(r.run_type || 'batch_upload'),
        source_filename: String(r.source_filename || 'screening_dataset.csv'),
        triggered_by: String(r.triggered_by || 'QA Engineer'),
        created_at: String(r.created_at || new Date().toISOString()),
        total_components: Number(r.total_components || 0),
        total_lots: Number(r.total_lots || 1),
        anomalies_count: Number(r.anomalies_count || 0),
        critical_risk_count: Number(r.critical_risk_count || 0),
        high_risk_count: Number(r.high_risk_count || 0),
        status: (r.status as 'Completed' | 'Processing' | 'Failed') || 'Completed'
      }));
    } catch (err) {
      console.warn("Backend /api/db/runs unreachable, checking local fallback:", err);
      return [];
    }
  },

  getLots: async (): Promise<Lot[]> => {
    try {
      const res = await fetch(`${API_BASE}/lots`);
      if (!res.ok) throw new Error("Failed to fetch lots");
      const data = await res.json();
      return data.lots.map((l: Record<string, unknown>) => ({
        id: String(l.lotId || l.lot_id),
        componentType: String(l.componentType || 'IRF540N Power MOSFET'),
        totalComponents: Number(l.totalComponents || l.total_components || 0),
        checkpoint: String(l.checkpoint || '72h'),
        anomalyRate: Number(l.anomalyRate || l.anomaly_rate || 0),
        anomaliesCount: Number(l.anomalyCount || l.anomalies_count || 0),
        highRiskCount: Number(l.highCount || l.high_risk_count || 0),
        criticalRiskCount: Number(l.criticalCount || l.critical_risk_count || 0),
        status: 'ANALYZED' as const
      }));
    } catch {
      return [];
    }
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
    try {
      const res = await fetch(`${API_BASE}/lots/${lotId}/components`);
      if (!res.ok) throw new Error("Failed to fetch components");
      const data = await res.json();
      return (data.components || []).map((c: Record<string, unknown>) => ({
        id: String(c.componentId || c.component_id),
        lotId: lotId,
        type: 'IRF540N Power MOSFET',
        absoluteSpec: c.risk === 'CRITICAL' ? 'FAIL' : 'PASS',
        lotRelativeBehaviour: c.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
        zScore: Number(c.lotZScore || 0),
        anomalyScore: Number(c.anomalyScore || (c.isAnomalous ? 0.85 : 0.05)),
        drift: Number(c.drift || 0),
        predicted168h: Number(c.predicted168h || 34.0),
        risk: (c.risk as string) || 'LOW',
        status: (c.failureMode as string) || 'Normal',
        reasons: (c.reasons as string) || 'Parameters within normal tolerance'
      })).sort((a: ComponentDetails, b: ComponentDetails) => b.anomalyScore - a.anomalyScore);
    } catch {
      return [];
    }
  },

  getComponent: async (compId: string): Promise<ComponentDetails | undefined> => {
    try {
      const res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) throw new Error("Failed to fetch component");
      const c = await res.json();
      const st = c.status || {};
      const m72 = c.measurementsAt72h || {};
      const z = c.lotRelativeZScores || {};
      return {
        id: String(c.componentId || compId),
        lotId: String(c.lotId || 'L01'),
        type: String(c.componentType || 'IRF540N Power MOSFET'),
        absoluteSpec: st.severity === 'CRITICAL' ? 'FAIL' : 'PASS',
        lotRelativeBehaviour: st.isAnomalous ? 'ANOMALOUS' : 'NORMAL',
        zScore: Number(z.rds_z || 0),
        anomalyScore: Number(st.futureProbability ?? (st.isAnomalous ? 0.85 : 0.05)),
        drift: m72.rds_on_mohm ? (m72.rds_on_mohm - 33.5) : 0,
        predicted168h: Number(m72.rds_on_mohm || 34.0),
        risk: ((st.severity as string)?.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL') || 'LOW',
        status: String(st.failureMode || 'NORMAL')
      };
    } catch {
      return undefined;
    }
  },

  getTrajectory: async (compId: string) => {
    try {
      const res = await fetch(`${API_BASE}/components/${compId}`);
      if (!res.ok) throw new Error("Failed to fetch trajectory");
      const data = await res.json();
      return (data.trajectory || []).map((t: { checkpoint: string; value: number }) => {
        const timeVal = parseInt(t.checkpoint.replace('h', ''));
        const isPredicted = timeVal > 72;
        return {
          time: t.checkpoint,
          value: isPredicted ? null : t.value,
          predictedValue: isPredicted ? t.value : null,
          lotAverage: data.lotBaseline ? (data.lotBaseline[t.checkpoint] || 33.8) : null,
          safetyBoundary: 44.0 // Datasheet RDS(on) max limit
        };
      });
    } catch {
      return [];
    }
  },
  
  uploadDataset: async (file: File): Promise<AnalysisRecord> => {
    return await api.analyzeCSV(file);
  },

  loadSampleDataset: async (): Promise<AnalysisRecord> => {
    return await api.analyzeSample();
  },

  analyzeCSV: async (file: File): Promise<AnalysisRecord> => {
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
    const data = await res.json();
    // Also fetch full analysis details to ensure rich dataset is ready
    return await api.getAnalysis(data.analysis_id || data.model_run_id);
  },

  analyzeSample: async (): Promise<AnalysisRecord> => {
    const res = await fetch(`${API_BASE}/analyze?use_sample=true`, {
      method: 'POST'
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Failed to load sample` }));
      throw new Error(err.detail || "Failed to load sample dataset");
    }
    const data = await res.json();
    const full = await api.getAnalysis(data.analysis_id || data.model_run_id);
    full.is_synthetic = true;
    return full;
  },

  getAnalysis: async (analysisId: string): Promise<AnalysisRecord> => {
    // 1. Direct Supabase query if configured
    if (isSupabaseConfigured()) {
      try {
        const supabaseData = await getLatestDashboardAnalysisFromSupabase(analysisId);
        if (supabaseData) {
          return {
            analysis_id: supabaseData.model_run_id,
            filename: supabaseData.filename,
            created_at: supabaseData.created_at,
            summary: {
              total_components: supabaseData.total_components,
              total_anomalies: supabaseData.total_anomalies,
              anomaly_rate: supabaseData.anomaly_rate,
              critical_risk_count: supabaseData.critical_risk_count,
              high_risk_count: supabaseData.high_risk_count,
              predicted_future_failures: supabaseData.predicted_future_failures,
              failure_mode_distribution: supabaseData.failure_mode_distribution?.map(f => ({ name: f.name, value: f.count, count: f.count })) || []
            },
            lot_breakdown: supabaseData.lot_breakdown.map(l => ({
              ...l,
              anomaly_rate: l.total_components > 0 ? l.anomalies_count / l.total_components : 0
            })),
            components: supabaseData.components.map(c => ({
              ...c,
              drain_current_a: c.drain_current_a || 16.1
            })),
            alerts: supabaseData.alerts
          };
        }
      } catch (e) {
        console.warn("Direct Supabase query failed, falling back to backend API:", e);
      }
    }

    // 2. Fetch from backend API
    const res = await fetch(`${API_BASE}/analyze/${analysisId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: `HTTP ${res.status}: Analysis not found` }));
      throw new Error(err.detail || "Failed to fetch analysis");
    }
    const data = await res.json();
    
    // Normalise structure if raw backend response
    const summary = data.summary || {
      total_components: data.total_components || (data.components?.length || 0),
      total_anomalies: data.anomalies_count ?? (data.components?.filter((c: AnalysisComponent) => c.is_anomaly)?.length || 0),
      anomaly_rate: data.anomaly_rate ?? 0.15,
      critical_risk_count: data.critical_risk_count ?? (data.components?.filter((c: AnalysisComponent) => c.risk_level === 'CRITICAL')?.length || 0),
      high_risk_count: data.high_risk_count ?? (data.components?.filter((c: AnalysisComponent) => c.risk_level === 'HIGH')?.length || 0),
      predicted_future_failures: data.predicted_failures_count ?? (data.components?.filter((c: AnalysisComponent) => c.predicted_future_failure)?.length || 0),
      failure_mode_distribution: data.failure_mode_distribution || []
    };

    return {
      analysis_id: data.analysis_id || analysisId,
      filename: data.filename || 'screening_dataset.csv',
      created_at: data.created_at || data.timestamp || new Date().toISOString(),
      summary,
      lot_breakdown: data.lot_breakdown || [],
      components: data.components || [],
      alerts: data.alerts || [],
      checkpoints_detected: data.checkpoints_detected || [0, 72],
      conflicts_count: data.conflicts_count,
      rejected_count: data.rejected_count,
      rejection_summary: data.rejection_summary,
      persisted_in_db: Boolean(data.persisted_in_db ?? true)
    };
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
    vth_0h?: number;
    vth_target?: number;
    rds_0h?: number;
    rds_target?: number;
    idss_0h?: number;
    idss_target?: number;
    drain_0h?: number;
    drain_target?: number;
    stress_temp_c?: number;
    stress_vds_v?: number;
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
  }
};
