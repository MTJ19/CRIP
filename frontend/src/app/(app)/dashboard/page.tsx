"use client";
import React, { useEffect, useState, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { GlassPanel, GlassBadge } from '@/components/ui-glass';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { 
  Cpu, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Activity, 
  TrendingUp, ShieldCheck, Zap, ArrowRight, Search, Filter, AlertCircle, 
  RefreshCw, Check, FileSpreadsheet
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const analysisIdParam = searchParams.get('analysis_id');

  const [analysis, setAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search state for components table
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [lotFilter, setLotFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'probability' | 'anomaly_score' | 'rds'>('risk');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    setLoading(true);
    setError(null);
    const targetId = analysisIdParam || 'latest';

    api.getAnalysis(targetId)
      .then(data => {
        setAnalysis(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load analysis:", err);
        setError(err.message || 'No analysis data found');
        setLoading(false);
      });
  }, [analysisIdParam]);

  // Derived filtered components
  const filteredComponents = useMemo(() => {
    if (!analysis?.components) return [];
    let list = [...analysis.components];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(c => 
        c.component_id.toLowerCase().includes(q) || 
        c.lot_id.toLowerCase().includes(q) ||
        (c.main_reason && c.main_reason.toLowerCase().includes(q))
      );
    }

    if (riskFilter !== 'ALL') {
      list = list.filter(c => c.risk_level === riskFilter);
    }

    if (lotFilter !== 'ALL') {
      list = list.filter(c => c.lot_id === lotFilter);
    }

    // Sort
    list.sort((a, b) => {
      if (sortBy === 'risk') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[b.risk_level] || 0) - (order[a.risk_level] || 0);
      } else if (sortBy === 'probability') {
        return (b.future_failure_probability || 0) - (a.future_failure_probability || 0);
      } else if (sortBy === 'anomaly_score') {
        return (b.anomaly_risk_score || 0) - (a.anomaly_risk_score || 0);
      } else if (sortBy === 'rds') {
        return (b.rds_on_mohm || 0) - (a.rds_on_mohm || 0);
      }
      return 0;
    });

    return list;
  }, [analysis, searchTerm, riskFilter, lotFilter, sortBy]);

  const totalPages = Math.ceil(filteredComponents.length / pageSize) || 1;
  const paginatedComponents = filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4 font-mono text-sm text-slate-400">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <div>Loading analysis results from FastAPI backend...</div>
      </div>
    );
  }

  // Empty state if no analysis run exists
  if (error || !analysis) {
    return (
      <div className="max-w-2xl mx-auto my-12 text-center p-8 bg-[#171920] border border-white/10 rounded-2xl font-mono">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Screening Analysis Ingested Yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          The dashboard requires an active analysis run. Please go to Workspace to upload a raw burn-in CSV dataset or load the full 10-lot IRF540N reference dataset.
        </p>
        <Link 
          href="/upload"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
        >
          <span>[ Go to Workspace ]</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  const { summary, lot_breakdown, alerts } = analysis;
  const totalComponents = summary.total_components;
  const totalAnomalies = summary.total_anomalies;
  const anomalyRate = (summary.anomaly_rate * 100).toFixed(1);
  const highRiskCount = summary.high_risk_count;
  const criticalRiskCount = summary.critical_risk_count;
  const futureFailures = summary.predicted_future_failures;

  // Real chart data for failure modes
  const failureModeData = summary.failure_mode_distribution?.filter((m: any) => m.name !== 'NORMAL') || [];

  return (
    <div className="flex flex-col space-y-6 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">IRF540N MOSFET Screening Dashboard</h1>
            <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
              {analysis.analysis_id}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            Source: <span className="text-slate-300">{analysis.filename}</span> • 72h Early Screening Checkpoint
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/upload"
            className="flex items-center px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono border border-white/10 transition-colors"
          >
            Workspace / Ingest New Data →
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Total Monitored</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono">{totalComponents}</div>
          <div className="text-[10px] text-slate-500 mt-1">{lot_breakdown?.length || 10} Manufacturing Lots</div>
        </GlassPanel>

        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Anomalies Flagged</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 font-mono">{totalAnomalies}</div>
          <div className="text-[10px] text-slate-500 mt-1">{anomalyRate}% of population</div>
        </GlassPanel>

        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Parts</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400 font-mono">{criticalRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Immediate screening hold</div>
        </GlassPanel>

        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>High Risk Parts</span>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono">{highRiskCount}</div>
          <div className="text-[10px] text-slate-500 mt-1">Secondary review hold</div>
        </GlassPanel>

        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>120h Failures</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400 font-mono">{futureFailures}</div>
          <div className="text-[10px] text-slate-500 mt-1">HistGradientBoosting</div>
        </GlassPanel>
      </div>

      {/* TOP CHARTS: Component Specs & Degradation Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Physical Specs Card */}
        <GlassPanel className="lg:col-span-4 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <GlassBadge className="bg-white/5 border-white/10 text-white">
              <Cpu className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> IRF540N MOSFET
            </GlassBadge>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Infineon Datasheet
            </span>
          </div>

          <div className="flex items-center justify-center my-4 relative">
            <div className="relative w-48 h-48 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-indigo-500/20 rounded-full blur-[35px] mix-blend-screen"></div>
              <Image 
                src="/component.jpg" 
                alt="IRF540N Power MOSFET" 
                width={192} 
                height={192} 
                priority
                className="relative z-10 object-cover mix-blend-screen pointer-events-none rounded-2xl"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 50%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 50%, transparent 75%)'
                }}
              />
            </div>
          </div>

          <div className="bg-[#171920] rounded-xl p-4 border border-white/5 font-mono text-xs space-y-2">
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Datasheet Thresholds:</div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>VDS Breakdown Limit:</span> <span className="text-white font-bold">100 V</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>VGS(th) Conduction Band:</span> <span className="text-white font-bold">2.0 – 4.0 V</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>RDS(on) Max Condition:</span> <span className="text-white font-bold">44 mΩ</span>
            </div>
            <div className="flex justify-between text-[11px] text-slate-300">
              <span>IDSS Demo Cutoff:</span> <span className="text-white font-bold">250 µA</span>
            </div>
          </div>
        </GlassPanel>

        {/* RIGHT: Injected Degradation Modes Distribution Chart */}
        <GlassPanel className="lg:col-span-8 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-bold text-white mb-0.5">Identified Degradation Modes in Population</h2>
              <p className="text-xs text-slate-400">Classified by lot-relative z-score deviations & drift dynamics</p>
            </div>
            <GlassBadge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20 text-xs">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Isolation Forest + Lot Z-Scores
            </GlassBadge>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={failureModeData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={46}>
                  {failureModeData.map((entry: any, index: number) => {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#ec4899'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-white/5 pt-3 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Total Anomalies Detected: {totalAnomalies} parts</span>
            <span className="text-emerald-400">Normal Baseline: {totalComponents - totalAnomalies} parts</span>
          </div>
        </GlassPanel>
      </div>

      {/* MANUFACTURING LOTS SUMMARY */}
      <GlassPanel className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Manufacturing Lots Summary</h3>
            <p className="text-xs text-slate-400">Aggregated from current screening run ({analysis.analysis_id})</p>
          </div>
          <span className="text-xs font-mono text-slate-500">GroupKFold Validation Batches</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          {lot_breakdown?.map((l: any) => (
            <Link 
              key={l.lot_id}
              href={`/lot/${l.lot_id}`}
              className="bg-[#171920] hover:bg-[#1f222b] p-3 rounded-xl border border-white/5 transition-colors block group"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">Lot {l.lot_id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  l.anomalies_count > 45 ? 'bg-red-500/20 text-red-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {l.anomalies_count} flags
                </span>
              </div>
              <div className="text-[10px] text-slate-400">{l.total_components} parts monitored</div>
              <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                <span>Crit: {l.critical_risk_count}</span>
                <span>Anom: {(l.anomaly_rate * 100).toFixed(1)}%</span>
              </div>
            </Link>
          ))}
        </div>
      </GlassPanel>

      {/* PRIORITY HIGH / CRITICAL ALERTS */}
      {alerts && alerts.length > 0 && (
        <GlassPanel className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-bold text-white">Priority High & Critical Screening Alerts</h3>
            </div>
            <span className="text-xs font-mono bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-1 rounded-full font-bold">
              {alerts.length} Flagged Components
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {alerts.slice(0, 5).map((a: any) => (
              <div 
                key={a.component_id}
                className="bg-[#171920] border border-white/5 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 hover:border-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    a.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                  }`}>
                    {a.risk_level}
                  </span>
                  <span className="font-bold text-white">{a.component_id}</span>
                  <span className="text-slate-400">Lot {a.lot_id}</span>
                </div>

                <div className="text-slate-300 text-[11px] flex-1 min-w-[200px]">
                  <span className="text-slate-500 mr-2">Driver:</span>
                  <span>{a.main_reason}</span>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">120H FAILURE PROB</div>
                    <div className="text-orange-400 font-bold">{(a.future_failure_probability * 100).toFixed(1)}%</div>
                  </div>
                  <Link 
                    href={`/component/${a.component_id}`}
                    className="px-3 py-1 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg border border-white/10 transition-colors text-[11px]"
                  >
                    Inspect →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </GlassPanel>
      )}

      {/* FULL SORTABLE & FILTERABLE COMPONENTS TABLE */}
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">All Monitored Components</h3>
            <p className="text-xs text-slate-400 font-mono">
              Showing {filteredComponents.length} parts matching active filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Search ID, Lot..."
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="bg-[#171920] border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Risk Filter */}
            <select
              value={riskFilter}
              onChange={e => { setRiskFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="CRITICAL">Critical Only</option>
              <option value="HIGH">High Only</option>
              <option value="MEDIUM">Medium Only</option>
              <option value="LOW">Low Only</option>
            </select>

            {/* Lot Filter */}
            <select
              value={lotFilter}
              onChange={e => { setLotFilter(e.target.value); setCurrentPage(1); }}
              className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="ALL">All Lots</option>
              {lot_breakdown?.map((l: any) => (
                <option key={l.lot_id} value={l.lot_id}>Lot {l.lot_id}</option>
              ))}
            </select>

            {/* Sort Filter */}
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="risk">Sort: Highest Risk</option>
              <option value="probability">Sort: 120h Failure Prob</option>
              <option value="anomaly_score">Sort: Anomaly Score</option>
              <option value="rds">Sort: RDS(on) 72h</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 text-[11px]">
                <th className="py-2.5 px-3">COMPONENT ID</th>
                <th className="py-2.5 px-3">LOT</th>
                <th className="py-2.5 px-3">RISK TIER</th>
                <th className="py-2.5 px-3">ANOMALY FLAG</th>
                <th className="py-2.5 px-3">120H PROB</th>
                <th className="py-2.5 px-3">RDS(ON) 72H</th>
                <th className="py-2.5 px-3">PRIMARY DRIVER</th>
                <th className="py-2.5 px-3 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedComponents.map((c: any) => (
                <tr key={c.component_id} className="hover:bg-white/5 transition-colors">
                  <td className="py-2 px-3 font-bold text-white">{c.component_id}</td>
                  <td className="py-2 px-3 text-slate-400">{c.lot_id}</td>
                  <td className="py-2 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      c.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                      c.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {c.is_anomaly ? (
                      <span className="text-amber-400 font-bold">FLAGGED</span>
                    ) : (
                      <span className="text-slate-500">Normal</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-white font-bold">
                    {(c.future_failure_probability * 100).toFixed(1)}%
                  </td>
                  <td className="py-2 px-3 text-slate-300">
                    {c.rds_on_mohm ? `${c.rds_on_mohm.toFixed(1)} mΩ` : '—'}
                  </td>
                  <td className="py-2 px-3 text-slate-400 max-w-xs truncate" title={c.main_reason}>
                    {c.main_reason}
                  </td>
                  <td className="py-2 px-3 text-right">
                    <Link 
                      href={`/component/${c.component_id}`}
                      className="text-indigo-400 hover:text-indigo-300 underline"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 font-mono text-xs text-slate-400">
          <div>
            Page {currentPage} of {totalPages} ({filteredComponents.length} total)
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded bg-[#171920] border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded bg-[#171920] border border-white/10 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white/5"
            >
              Next
            </button>
          </div>
        </div>
      </GlassPanel>

    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-mono text-sm">
        <RefreshCw className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
        Loading Dashboard...
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
