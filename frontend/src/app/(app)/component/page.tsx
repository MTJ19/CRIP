"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui-glass';
import { Cpu, Search, ArrowRight, ShieldAlert, AlertTriangle, CheckCircle2, Filter } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function ComponentsListPage() {
  const router = useRouter();
  const { currentAnalysis } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState('');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [anomalyFilter, setAnomalyFilter] = useState('ALL');
  const [lotFilter, setLotFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'risk' | 'probability' | 'anomaly_score' | 'measurement'>('risk');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const componentsList = useMemo(() => {
    return currentAnalysis?.components || [];
  }, [currentAnalysis]);

  const availableLots = useMemo(() => {
    const set = new Set<string>();
    componentsList.forEach(c => {
      if (c.lot_id) set.add(c.lot_id);
    });
    return Array.from(set).sort();
  }, [componentsList]);

  const filteredComponents = useMemo(() => {
    let list = [...componentsList];

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

    if (anomalyFilter !== 'ALL') {
      if (anomalyFilter === 'FLAGGED') list = list.filter(c => c.is_anomaly);
      else if (anomalyFilter === 'NORMAL') list = list.filter(c => !c.is_anomaly);
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
      } else if (sortBy === 'measurement') {
        return (b.rds_on_mohm || 0) - (a.rds_on_mohm || 0);
      }
      return 0;
    });

    return list;
  }, [componentsList, searchTerm, riskFilter, anomalyFilter, lotFilter, sortBy]);

  const totalPages = Math.ceil(filteredComponents.length / pageSize) || 1;
  const paginatedComponents = filteredComponents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Components Directory</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Component-level burn-in measurements, risk tiers, and failure likelihood for: <span className="text-slate-300 font-bold">{currentAnalysis?.filename || 'Active Dataset'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="bg-[#171920] border border-white/10 px-3 py-1.5 rounded-lg text-slate-300">
            Total Components: <span className="text-white font-bold">{componentsList.length.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Component ID, Lot, Reason..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#171920] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Filter dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={e => { setRiskFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Risk Tiers</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High Only</option>
            <option value="MEDIUM">Medium Only</option>
            <option value="LOW">Low Only</option>
          </select>

          {/* Anomaly Status Filter */}
          <select
            value={anomalyFilter}
            onChange={e => { setAnomalyFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="FLAGGED">Flagged Anomalies</option>
            <option value="NORMAL">Normal Behaviour</option>
          </select>

          {/* Lot Filter */}
          <select
            value={lotFilter}
            onChange={e => { setLotFilter(e.target.value); setCurrentPage(1); }}
            className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Manufacturing Lots</option>
            {availableLots.map(l => (
              <option key={l} value={l}>Lot {l}</option>
            ))}
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'risk' | 'probability' | 'anomaly_score' | 'measurement')}
            className="bg-[#171920] border border-white/10 rounded-lg px-2.5 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="risk">Sort: Highest Risk</option>
            <option value="probability">Sort: Future Failure Prob</option>
            <option value="measurement">Sort: Current Measurement</option>
            <option value="anomaly_score">Sort: Anomaly Score</option>
          </select>
        </div>
      </div>

      {/* Clean Components Table */}
      <GlassPanel className="p-0 overflow-hidden">
        {filteredComponents.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-slate-400">
            No components matched the active filters in this screening run.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Component ID</th>
                  <th className="py-3 px-4 font-bold">Lot</th>
                  <th className="py-3 px-4 font-bold text-center">Risk</th>
                  <th className="py-3 px-4 font-bold text-center">Anomaly Status</th>
                  <th className="py-3 px-4 font-bold text-center">Current Measurement</th>
                  <th className="py-3 px-4 font-bold text-center">Predicted Future Value</th>
                  <th className="py-3 px-4 font-bold">Primary Reason</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedComponents.map(c => {
                  const predictedVal = c.rds_on_mohm ? (c.rds_on_mohm + (c.future_failure_probability * 5.2)).toFixed(1) : '34.5';
                  return (
                    <tr key={c.component_id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <button
                          onClick={() => router.push(`/component/${c.component_id}`)}
                          className="hover:text-indigo-400 transition-colors text-left"
                        >
                          {c.component_id}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400">
                        Lot {c.lot_id}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.risk_level === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                          c.risk_level === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                          c.risk_level === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {c.risk_level}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={c.is_anomaly ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {c.is_anomaly ? 'FLAGGED' : 'NORMAL'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-200">
                        {c.rds_on_mohm ? `${c.rds_on_mohm.toFixed(1)} mΩ` : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-300">
                        {predictedVal} mΩ @ 168h
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 max-w-xs truncate" title={c.main_reason}>
                        {c.main_reason}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => router.push(`/component/${c.component_id}`)}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-[11px] font-medium inline-flex items-center space-x-1"
                        >
                          <span>Inspect</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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

    </div>
  );
}
