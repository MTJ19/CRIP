import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(
    supabaseUrl && 
    supabaseAnonKey && 
    !supabaseUrl.includes('your-project-id') &&
    supabaseUrl.startsWith('http')
  );
};

// Create a single supabase client for interacting with your database
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface DbModelRun {
  id: string;
  run_type: 'batch_upload' | 'single_component_test';
  source_filename: string | null;
  triggered_by: string | null;
  created_at: string;
}

export interface DbAnalysisSummary {
  model_run_id: string;
  filename: string;
  run_type: string;
  created_at: string;
  total_components: number;
  total_anomalies: number;
  anomaly_rate: number;
  critical_risk_count: number;
  high_risk_count: number;
  predicted_future_failures: number;
  lot_breakdown: Array<{
    lot_id: string;
    total_components: number;
    anomalies_count: number;
    critical_risk_count: number;
    high_risk_count: number;
    predicted_future_failures: number;
  }>;
  failure_mode_distribution: Array<{
    name: string;
    count: number;
  }>;
  alerts: Array<{
    id: string;
    component_id: string;
    lot_id: string;
    risk_level: string;
    main_reason: string;
    recommended_action: string;
  }>;
  components: Array<{
    component_id: string;
    lot_id: string;
    risk_level: string;
    is_anomaly: boolean;
    anomaly_risk_score: number;
    predicted_future_failure: boolean;
    future_failure_probability: number;
    rds_on_mohm: number;
    idss_leakage_ua: number;
    vth_v: number;
    drain_current_a: number;
    failure_mode: string;
    main_reason: string;
    recommended_action: string;
  }>;
}

/**
 * Direct Supabase queries for the dashboard widgets
 */
export async function getLatestDashboardAnalysisFromSupabase(targetRunId?: string): Promise<DbAnalysisSummary | null> {
  if (!supabase) return null;

  try {
    // 1. Fetch target or latest model run
    let runQuery = supabase.from('model_runs').select('*').order('created_at', { ascending: false }).limit(1);
    if (targetRunId && targetRunId !== 'latest') {
      runQuery = supabase.from('model_runs').select('*').eq('id', targetRunId).limit(1);
    }
    const { data: runs, error: runError } = await runQuery;
    if (runError || !runs || runs.length === 0) {
      return null;
    }

    const run = runs[0];
    const runId = run.id;

    // 2. Fetch risk assessments, anomaly results, drift predictions joined with components & lots
    const [riskRes, anomRes, driftRes] = await Promise.all([
      supabase
        .from('risk_assessments')
        .select('id, component_id, risk_level, main_reason, recommended_action, components!inner(component_external_id, lot_id, lots!inner(lot_code))')
        .eq('model_run_id', runId),
      supabase
        .from('anomaly_results')
        .select('component_id, anomaly_risk_score, anomaly_threshold, is_anomaly')
        .eq('model_run_id', runId),
      supabase
        .from('drift_predictions')
        .select('component_id, future_failure_probability, future_failure_threshold, predicted_future_failure')
        .eq('model_run_id', runId)
    ]);

    if (riskRes.error) throw riskRes.error;

    const riskMap = new Map();
    (riskRes.data || []).forEach(r => riskMap.set(r.component_id, r));

    const anomMap = new Map();
    (anomRes.data || []).forEach(a => anomMap.set(a.component_id, a));

    const driftMap = new Map();
    (driftRes.data || []).forEach(d => driftMap.set(d.component_id, d));

    // Also fetch 72h measurements for these components if available
    const compIds = Array.from(riskMap.keys());
    let measurementMap = new Map();
    if (compIds.length > 0) {
      const { data: measurements } = await supabase
        .from('component_measurements')
        .select('component_id, vth_v, rds_on_mohm, idss_leakage_ua, drain_current_a')
        .in('component_id', compIds)
        .eq('test_hour', 72);

      (measurements || []).forEach(m => measurementMap.set(m.component_id, m));
    }

    // Build unified component list
    const components: DbAnalysisSummary['components'] = [];
    const lotStats: Record<string, { total: number; anom: number; crit: number; high: number; failures: number }> = {};
    const modeCounts: Record<string, number> = {};

    let totalAnomalies = 0;
    let criticalCount = 0;
    let highCount = 0;
    let failureCount = 0;

    for (const [compId, risk] of riskMap.entries()) {
      const anom = anomMap.get(compId) || { anomaly_risk_score: 0, is_anomaly: false };
      const drift = driftMap.get(compId) || { future_failure_probability: 0, predicted_future_failure: false };
      const meas = measurementMap.get(compId) || { vth_v: 2.9, rds_on_mohm: 33.5, idss_leakage_ua: 37.0, drain_current_a: 16.1 };

      const lotCode = risk.components?.lots?.lot_code || 'L01';
      const extId = risk.components?.component_external_id || compId;

      if (!lotStats[lotCode]) {
        lotStats[lotCode] = { total: 0, anom: 0, crit: 0, high: 0, failures: 0 };
      }
      lotStats[lotCode].total += 1;

      if (anom.is_anomaly) {
        totalAnomalies += 1;
        lotStats[lotCode].anom += 1;
      }
      if (risk.risk_level === 'CRITICAL') {
        criticalCount += 1;
        lotStats[lotCode].crit += 1;
      } else if (risk.risk_level === 'HIGH') {
        highCount += 1;
        lotStats[lotCode].high += 1;
      }
      if (drift.predicted_future_failure) {
        failureCount += 1;
        lotStats[lotCode].failures += 1;
      }

      // Mode detection from main_reason
      const reasonLower = (risk.main_reason || '').toLowerCase();
      let mode = 'NORMAL';
      if (anom.is_anomaly) {
        if (reasonLower.includes('leakage')) mode = 'LEAKAGE_DRIFT';
        else if (reasonLower.includes('rds')) mode = 'RDS_DRIFT';
        else if (reasonLower.includes('threshold') || reasonLower.includes('vth')) mode = 'VTH_DRIFT';
        else mode = 'DEGRADATION';
      }
      modeCounts[mode] = (modeCounts[mode] || 0) + 1;

      components.push({
        component_id: extId,
        lot_id: lotCode,
        risk_level: risk.risk_level,
        is_anomaly: Boolean(anom.is_anomaly),
        anomaly_risk_score: Number(anom.anomaly_risk_score || 0),
        predicted_future_failure: Boolean(drift.predicted_future_failure),
        future_failure_probability: Number(drift.future_failure_probability || 0),
        rds_on_mohm: Number(meas.rds_on_mohm || 0),
        idss_leakage_ua: Number(meas.idss_leakage_ua || 0),
        vth_v: Number(meas.vth_v || 0),
        drain_current_a: Number(meas.drain_current_a || 0),
        failure_mode: mode,
        main_reason: risk.main_reason,
        recommended_action: risk.recommended_action
      });
    }

    const totalComps = components.length;
    const lotBreakdown = Object.entries(lotStats).map(([lotId, s]) => ({
      lot_id: lotId,
      total_components: s.total,
      anomalies_count: s.anom,
      critical_risk_count: s.crit,
      high_risk_count: s.high,
      predicted_future_failures: s.failures
    }));

    const failureModeDistribution = Object.entries(modeCounts).map(([name, count]) => ({
      name,
      value: count,
      count
    }));

    const alerts = components
      .filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH')
      .slice(0, 20)
      .map((c, idx) => ({
        id: `ALT-${idx + 1}`,
        component_id: c.component_id,
        lot_id: c.lot_id,
        risk_level: c.risk_level,
        main_reason: c.main_reason,
        recommended_action: c.recommended_action
      }));

    return {
      model_run_id: runId,
      filename: run.source_filename || 'Supabase Model Run',
      run_type: run.run_type,
      created_at: run.created_at,
      total_components: totalComps,
      total_anomalies: totalAnomalies,
      anomaly_rate: totalComps > 0 ? totalAnomalies / totalComps : 0,
      critical_risk_count: criticalCount,
      high_risk_count: highCount,
      predicted_future_failures: failureCount,
      lot_breakdown: lotBreakdown,
      failure_mode_distribution: failureModeDistribution,
      alerts: alerts,
      components: components
    };
  } catch (err) {
    console.error("Error querying Supabase directly:", err);
    return null;
  }
}
