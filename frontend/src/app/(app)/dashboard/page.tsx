"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel, GlassBadge } from '@/components/ui-glass';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { 
  Cpu, ShieldAlert, AlertTriangle, Layers, Activity, 
  TrendingUp, ArrowRight, Search, FileSpreadsheet,
  ChevronDown, ChevronUp, ShieldCheck
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useAnalysis } from '@/context/AnalysisContext';

export default function DashboardPage() {
  const router = useRouter();
  const { currentAnalysis, isLoading, error } = useAnalysis();

  // Filter & Search state for components table
  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [lotFilter, setLotFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'probability' | 'anomaly_score' | 'rds'>('risk');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  // Technical details drawer toggle
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // Derived filtered components
  const filteredComponents = useMemo(() => {
    if (!currentAnalysis?.components) return [];
    let list = [...currentAnalysis.components];

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
  }, [currentAnalysis, searchTerm, riskFilter, lotFilter, sortBy]);

  const totalPages = Math.ceil(filteredComponents.length / pageSize) || 1;
  const paginatedComponents = filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 font-mono text-xs text-slate-400">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin"></div>
        <div>Loading active screening analysis...</div>
      </div>
    );
  }

  // Proper Empty State (PART 17)
  if (!currentAnalysis || error) {
    return (
      <div className="max-w-2xl mx-auto my-16 text-center p-10 bg-[#16181d] border border-white/10 rounded-2xl font-mono">
        <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500/20">
          <FileSpreadsheet className="w-8 h-8 text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Screening Analysis Yet</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
          Upload a burn-in dataset to begin analyzing component reliability and screening risk.
        </p>
        <Link 
          href="/upload"
          className="inline-flex items-center px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)]"
        >
          <span>Upload Dataset</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
      </div>
    );
  }

  const { summary, lot_breakdown, alerts } = currentAnalysis;
  const totalComponents = summary.total_components;
  const totalAnomalies = summary.total_anomalies;
  const highRiskCount = summary.high_risk_count;
  const criticalRiskCount = summary.critical_risk_count;
  const futureFailures = summary.predicted_future_failures;

  // Real chart data for failure modes
  const failureModeData = summary.failure_mode_distribution?.filter((m) => m.name !== 'NORMAL') || [];

  const displayAnalysisId = currentAnalysis.analysis_id.startsWith('ANL-')
    ? currentAnalysis.analysis_id
    : `ANL-${currentAnalysis.analysis_id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase()}`;

  return (
    <div className="flex flex-col space-y-6 pb-16">
      
      {/* Overview Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Burn-In Screening Overview</h1>
          <p className="text-xs text-slate-400 mt-1 font-mono flex flex-wrap items-center gap-1.5">
            <span className="text-slate-200 font-semibold">IRF540N Power MOSFET</span>
            <span className="text-slate-600">·</span>
            <span>Analysis #{displayAnalysisId}</span>
            <span className="text-slate-600">•</span>
            <span>Source: <span className="text-slate-300 font-medium">{currentAnalysis.filename}</span></span>
            <span className="text-slate-600">•</span>
            <span>72h Early Screening Checkpoint</span>
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/upload"
            className="flex items-center px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-mono border border-white/10 transition-colors"
          >
            Upload New Screening Data →
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS ROW (PART 3) */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 font-mono">
        {/* Metric 1 */}
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Components Analyzed</span>
            <Cpu className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white">{totalComponents.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">{lot_breakdown?.length || 10} manufacturing lots</div>
        </GlassPanel>

        {/* Metric 2 */}
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Components Needing Attention</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalAnomalies.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Components showing unusual behaviour</div>
        </GlassPanel>

        {/* Metric 3 */}
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Critical Components</span>
            <ShieldAlert className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-red-400">{criticalRiskCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Require immediate review</div>
        </GlassPanel>

        {/* Metric 4 */}
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>High-Risk Components</span>
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400">{highRiskCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Require secondary screening</div>
        </GlassPanel>

        {/* Metric 5 */}
        <GlassPanel className="p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span>Predicted Future Failures</span>
            <TrendingUp className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-orange-400">{futureFailures}</div>
          <div className="text-[10px] text-slate-400 mt-1">Based on current degradation trends</div>
        </GlassPanel>
      </div>

      {/* TOP CHARTS: Component Specs & Degradation Modes (PART 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Component Reference Card */}
        <GlassPanel className="lg:col-span-4 p-6 flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Component Reference</h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">IRF540N Power MOSFET</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="text-[10px] font-mono text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-medium">
                Reference specifications
              </span>
              <a 
                href="https://www.infineon.com" 
                target="_blank" 
                rel="noreferrer" 
                className="text-[9px] font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                Infineon Datasheet ↗
              </a>
            </div>
          </div>

          <div className="flex items-center justify-center my-3 relative">
            <div className="relative w-40 h-40 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-indigo-500/20 rounded-full blur-[35px] mix-blend-screen"></div>
              <Image 
                src="/component.jpg" 
                alt="IRF540N Power MOSFET" 
                width={160} 
                height={160} 
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
            <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">Datasheet Threshold Limits:</div>
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

        {/* RIGHT: Degradation Modes Distribution Chart */}
        <GlassPanel className="lg:col-span-8 p-6 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-base font-bold text-white mb-0.5">Common Abnormal Behaviour Patterns</h2>
              <p className="text-xs text-slate-400 font-mono">Distribution of detected physical degradation mechanisms</p>
            </div>
            <GlassBadge className="bg-white/5 text-slate-300 border-white/10 text-xs font-mono">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Statistical Lot Dispersion
            </GlassBadge>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart accessibilityLayer={false} data={failureModeData} margin={{ top: 15, right: 10, left: -20, bottom: 5 }} barGap={6}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff08" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip cursor={false} contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={46}>
                  {failureModeData.map((entry, index) => {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#a855f7', '#ec4899'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="border-t border-white/5 pt-3 text-xs text-slate-400 flex items-center justify-between font-mono">
            <span>Total Anomalies Detected: <strong className="text-amber-400">{totalAnomalies}</strong> parts</span>
            <span className="text-emerald-400">Normal Baseline: <strong>{totalComponents - totalAnomalies}</strong> parts</span>
          </div>
        </GlassPanel>
      </div>

      {/* MANUFACTURING LOTS SUMMARY (PART 4) */}
      <GlassPanel className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Lots Requiring Attention</h3>
            <p className="text-xs text-slate-400 font-mono">Aggregated screening yield from current run ({currentAnalysis.analysis_id})</p>
          </div>
          <Link href="/lot" className="text-xs font-mono text-indigo-400 hover:text-indigo-300">
            View All Lots Table →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono text-xs">
          {lot_breakdown?.map((l) => (
            <Link 
              key={l.lot_id}
              href={`/lot/${l.lot_id}`}
              className="bg-[#171920] hover:bg-[#1f222b] p-3 rounded-xl border border-white/5 transition-colors block group"
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">Lot {l.lot_id}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  l.critical_risk_count > 0 
                    ? 'bg-red-500/20 text-red-300' 
                    : l.anomalies_count > 0 
                    ? 'bg-amber-500/20 text-amber-300' 
                    : 'bg-emerald-500/20 text-emerald-300'
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

      {/* PRIORITY SCREENING ALERTS */}
      {alerts && alerts.length > 0 && (
        <GlassPanel className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <h3 className="text-base font-bold text-white">Priority High & Critical Screening Alerts</h3>
            </div>
            <Link 
              href="/alerts"
              className="text-xs font-mono bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-1 rounded-full font-bold hover:bg-red-500/20 transition-colors"
            >
              {alerts.length} Flagged Components →
            </Link>
          </div>

          <div className="space-y-2 font-mono text-xs">
            {alerts.slice(0, 5).map((a) => (
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

      {/* FULL FILTERABLE COMPONENTS DIRECTORY */}
      <GlassPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Components in Screening Run</h3>
            <p className="text-xs text-slate-400 font-mono">
              Showing {filteredComponents.length} parts matching active filters
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
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

            <select 
              value={lotFilter} 
              onChange={e => { setLotFilter(e.target.value); setCurrentPage(1); }} 
              className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white"
            >
              <option value="ALL">All Lots</option>
              {lot_breakdown?.map((l) => (
                <option key={l.lot_id} value={l.lot_id}>Lot {l.lot_id}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px]">
                <th className="p-3 font-bold">Component ID</th>
                <th className="p-3 font-bold">Lot</th>
                <th className="p-3 font-bold text-center">Risk</th>
                <th className="p-3 font-bold text-center">Anomaly Flag</th>
                <th className="p-3 font-bold text-center">RDS(on) @ 72h</th>
                <th className="p-3 font-bold">Primary Reason</th>
                <th className="p-3 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedComponents.map((c) => (
                <tr key={c.component_id} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-white">{c.component_id}</td>
                  <td className="p-3 text-slate-400">Lot {c.lot_id}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      c.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                      c.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                      c.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {c.risk_level}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={c.is_anomaly ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                      {c.is_anomaly ? 'FLAGGED' : 'NORMAL'}
                    </span>
                  </td>
                  <td className="p-3 text-center text-slate-200">
                    {c.rds_on_mohm ? `${c.rds_on_mohm.toFixed(1)} mΩ` : '—'}
                  </td>
                  <td className="p-3 text-slate-400 max-w-xs truncate" title={c.main_reason}>
                    {c.main_reason}
                  </td>
                  <td className="p-3 text-right">
                    <Link 
                      href={`/component/${c.component_id}`}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between font-mono text-xs text-slate-400">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredComponents.length)} of {filteredComponents.length} components
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </GlassPanel>

      {/* COLLAPSIBLE TECHNICAL / MODEL INFORMATION (PART 5) */}
      <div className="border-t border-white/5 pt-4">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center space-x-2 transition-colors"
        >
          {showTechnicalDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{showTechnicalDetails ? 'Hide AI Detection Details' : 'Show AI Detection Details (Model Information)'}</span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 bg-[#171920]/60 rounded-xl p-5 border border-white/5 font-mono text-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-400">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Detection Method</div>
              <div className="text-white font-medium mt-1">Isolation Forest + statistical lot analysis</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Prediction Model</div>
              <div className="text-white font-medium mt-1">HistGradientBoostingClassifier</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Features Used</div>
              <div className="text-white font-medium mt-1">Parameter drift & lot z-scores</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Model Version</div>
              <div className="text-white font-medium mt-1">sih_mosfet_ml_v2</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
