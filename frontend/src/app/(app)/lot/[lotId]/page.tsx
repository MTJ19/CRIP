"use client";
import React, { useEffect, useState, use, useMemo } from 'react';
import { api, AnalysisComponent } from '@/services/api';
import { GlassPanel, GlassHeader, GlassBadge } from '@/components/ui-glass';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function LotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const lotId = resolvedParams.lotId;
  const { currentAnalysis } = useAnalysis();

  // 1. Derive directly from active AnalysisContext
  const contextLot = useMemo(() => {
    if (!currentAnalysis?.lot_breakdown) return null;
    const match = currentAnalysis.lot_breakdown.find(l => l.lot_id === lotId);
    if (!match) return null;
    return {
      lotId: match.lot_id,
      total: match.total_components,
      flagged: match.anomalies_count,
      critical: match.critical_risk_count,
      high: match.high_risk_count,
      checkpoint: match.checkpoint || '72h Screening Checkpoint'
    };
  }, [currentAnalysis, lotId]);

  const contextComponents = useMemo(() => {
    if (!currentAnalysis?.components) return null;
    return currentAnalysis.components.filter(c => c.lot_id === lotId);
  }, [currentAnalysis, lotId]);

  // 2. Fallback state for when lot is not in active context
  const [fallbackLot, setFallbackLot] = useState<{
    lotId: string;
    total: number;
    flagged: number;
    critical: number;
    high: number;
    checkpoint: string;
  } | null>(null);
  const [fallbackComponents, setFallbackComponents] = useState<AnalysisComponent[]>([]);
  const [isFetching, setIsFetching] = useState(!contextLot);

  useEffect(() => {
    if (contextLot) return;

    let isMounted = true;

    Promise.all([
      api.getLot(lotId),
      api.getComponents(lotId)
    ]).then(([l, comps]) => {
      if (!isMounted) return;
      if (l) {
        setFallbackLot({
          lotId: l.id,
          total: l.totalComponents,
          flagged: l.anomaliesCount,
          critical: l.criticalRiskCount,
          high: l.highRiskCount,
          checkpoint: l.checkpoint
        });
      }
      if (comps && comps.length > 0) {
        setFallbackComponents(comps.map(c => ({
          component_id: c.id,
          lot_id: c.lotId,
          risk_level: c.risk,
          is_anomaly: c.lotRelativeBehaviour === 'ANOMALOUS',
          anomaly_risk_score: c.anomalyScore,
          future_failure_probability: c.anomalyScore,
          predicted_future_failure: c.risk === 'CRITICAL' || c.risk === 'HIGH',
          rds_on_mohm: c.predicted168h,
          idss_leakage_ua: 37.0,
          vth_v: 2.9,
          drain_current_a: 16.1,
          failure_mode: c.lotRelativeBehaviour === 'ANOMALOUS' ? 'LEAKAGE_DRIFT' : 'NORMAL',
          main_reason: c.primaryRiskFactor || c.reasons || 'Parameters within normal variance',
          recommended_action: c.risk === 'CRITICAL' ? 'Immediate review hold' : 'Continue screening'
        })));
      }
      setIsFetching(false);
    }).catch(() => {
      if (isMounted) setIsFetching(false);
    });

    return () => { isMounted = false; };
  }, [contextLot, lotId]);

  const lotData = contextLot || fallbackLot;
  const components = contextComponents || fallbackComponents;

  if (!lotData && isFetching) {
    return <div className="p-8 font-mono text-xs text-slate-400">Loading lot screening details...</div>;
  }

  if (!lotData) {
    return (
      <div className="p-8 font-mono text-center">
        <h2 className="text-lg font-bold text-white mb-2">Lot Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">The requested lot ID does not exist in the active analysis.</p>
        <Link href="/lot" className="text-xs text-indigo-400 hover:underline">← Back to Lots Table</Link>
      </div>
    );
  }

  const hasCritical = lotData.critical > 0;
  const hasAttention = lotData.flagged > 0 || lotData.high > 0;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      
      {/* Back link & Lot Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <Link 
            href="/lot" 
            className="inline-flex items-center text-xs font-mono text-slate-400 hover:text-white mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Lots Table</span>
          </Link>
          <GlassHeader 
            title={`Lot Analysis: ${lotData.lotId}`} 
            subtitle={`IRF540N Power MOSFET Screening • Checkpoint: ${lotData.checkpoint}`} 
          />
        </div>

        <GlassBadge className={`px-3 py-1.5 font-mono text-xs ${
          hasCritical 
            ? 'bg-red-500/15 text-red-300 border-red-500/30' 
            : hasAttention 
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
            : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
        }`}>
          {hasCritical && <ShieldAlert className="w-4 h-4 mr-1.5 text-red-400" />}
          {!hasCritical && hasAttention && <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-400" />}
          {!hasCritical && !hasAttention && <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />}
          <span>{hasCritical ? 'Critical Lot Attention Required' : hasAttention ? 'Lot Needs Inspection' : 'Lot Normal Yield'}</span>
        </GlassBadge>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
        <GlassPanel className="p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Components Monitored</div>
          <div className="text-2xl font-bold text-white">{lotData.total}</div>
          <div className="text-[10px] text-slate-400 mt-1">Total screening population</div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Components Flagged</div>
          <div className="text-2xl font-bold text-amber-400">{lotData.flagged}</div>
          <div className="text-[10px] text-slate-400 mt-1">Showing parameter deviations</div>
        </GlassPanel>

        <GlassPanel className="p-5">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Critical Components</div>
          <div className="text-2xl font-bold text-red-400">{lotData.critical}</div>
          <div className="text-[10px] text-slate-400 mt-1">Require immediate quarantine</div>
        </GlassPanel>
      </div>

      {/* Components in Lot */}
      <GlassPanel className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-base font-bold text-white">Components in Lot {lotData.lotId}</h3>
            <p className="text-xs text-slate-400 font-mono">
              Individual component screening measurements and degradation risk scores
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">{components.length} components listed</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px]">
                <th className="p-3 font-bold">Component ID</th>
                <th className="p-3 font-bold text-center">Risk Level</th>
                <th className="p-3 font-bold text-center">Anomaly Flag</th>
                <th className="p-3 font-bold text-center">RDS(on) @ 72h</th>
                <th className="p-3 font-bold text-center">Future Risk</th>
                <th className="p-3 font-bold">Primary Reason</th>
                <th className="p-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {components.map((comp) => (
                <tr key={comp.component_id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-3 font-bold text-white">
                    <Link href={`/component/${comp.component_id}`} className="group-hover:text-indigo-400 transition-colors">
                      {comp.component_id}
                    </Link>
                  </td>

                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      comp.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      comp.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                      comp.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {comp.risk_level}
                    </span>
                  </td>

                  <td className="p-3 text-center">
                    <span className={comp.is_anomaly ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {comp.is_anomaly ? 'FLAGGED' : 'NORMAL'}
                    </span>
                  </td>

                  <td className="p-3 text-center text-slate-300">
                    {comp.rds_on_mohm ? `${comp.rds_on_mohm.toFixed(1)} mΩ` : '—'}
                  </td>

                  <td className="p-3 text-center text-slate-300">
                    {comp.future_failure_probability ? `${(comp.future_failure_probability * 100).toFixed(0)}%` : '—'}
                  </td>

                  <td className="p-3 text-slate-400 max-w-xs truncate" title={comp.main_reason}>
                    {comp.main_reason}
                  </td>

                  <td className="p-3 text-right">
                    <Link 
                      href={`/component/${comp.component_id}`}
                      className="text-indigo-400 hover:text-indigo-300 text-xs font-medium inline-flex items-center"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>

    </div>
  );
}
