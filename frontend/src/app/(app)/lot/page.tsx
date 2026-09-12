"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui-glass';
import { Layers, Search, ArrowRight, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function LotsListPage() {
  const router = useRouter();
  const { currentAnalysis } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<'ALL' | 'CRITICAL' | 'NEEDS_ATTENTION' | 'NORMAL'>('ALL');
  const [sortBy, setSortBy] = useState<'flagged' | 'critical' | 'components' | 'id'>('flagged');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const lotList = useMemo(() => {
    if (!currentAnalysis?.lot_breakdown) return [];
    
    return currentAnalysis.lot_breakdown.map(l => {
      let healthStatus: 'Critical' | 'Needs Attention' | 'Normal' = 'Normal';
      if (l.critical_risk_count > 0) {
        healthStatus = 'Critical';
      } else if (l.anomalies_count > 0 || l.high_risk_count > 0) {
        healthStatus = 'Needs Attention';
      }

      return {
        lot_id: l.lot_id,
        total_components: l.total_components,
        flagged: l.anomalies_count,
        critical: l.critical_risk_count,
        high: l.high_risk_count,
        healthStatus,
        anomalyRate: l.anomaly_rate
      };
    });
  }, [currentAnalysis]);

  const filteredLots = useMemo(() => {
    let list = [...lotList];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(l => l.lot_id.toLowerCase().includes(q));
    }

    if (healthFilter !== 'ALL') {
      if (healthFilter === 'CRITICAL') list = list.filter(l => l.healthStatus === 'Critical');
      else if (healthFilter === 'NEEDS_ATTENTION') list = list.filter(l => l.healthStatus === 'Needs Attention');
      else if (healthFilter === 'NORMAL') list = list.filter(l => l.healthStatus === 'Normal');
    }

    list.sort((a, b) => {
      if (sortBy === 'flagged') return b.flagged - a.flagged;
      if (sortBy === 'critical') return b.critical - a.critical;
      if (sortBy === 'components') return b.total_components - a.total_components;
      if (sortBy === 'id') return a.lot_id.localeCompare(b.lot_id);
      return 0;
    });

    return list;
  }, [lotList, searchTerm, healthFilter, sortBy]);

  const totalPages = Math.ceil(filteredLots.length / pageSize) || 1;
  const paginatedLots = filteredLots.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Manufacturing Lots</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Lot-level reliability distribution and screening yield for dataset: <span className="text-slate-300 font-bold">{currentAnalysis?.filename || 'Active Screening'}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="bg-[#171920] border border-white/10 px-3 py-1.5 rounded-lg text-slate-300">
            Total Lots: <span className="text-white font-bold">{lotList.length}</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search Lot ID..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-[#171920] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Health Filter */}
          <select
            value={healthFilter}
            onChange={e => { setHealthFilter(e.target.value as 'ALL' | 'CRITICAL' | 'NEEDS_ATTENTION' | 'NORMAL'); setCurrentPage(1); }}
            className="bg-[#171920] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Health Tiers</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="NEEDS_ATTENTION">Needs Attention</option>
            <option value="NORMAL">Normal Yield</option>
          </select>

          {/* Sort Filter */}
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as 'flagged' | 'critical' | 'components' | 'id')}
            className="bg-[#171920] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="flagged">Sort: Most Flagged</option>
            <option value="critical">Sort: Most Critical</option>
            <option value="components">Sort: Component Count</option>
            <option value="id">Sort: Lot ID</option>
          </select>
        </div>
      </div>

      {/* Clean Lots Table */}
      <GlassPanel className="p-0 overflow-hidden">
        {filteredLots.length === 0 ? (
          <div className="p-12 text-center font-mono text-xs text-slate-400">
            No manufacturing lots matched the active filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Lot ID</th>
                  <th className="py-3 px-4 font-bold text-center">Components</th>
                  <th className="py-3 px-4 font-bold text-center">Flagged</th>
                  <th className="py-3 px-4 font-bold text-center">Critical</th>
                  <th className="py-3 px-4 font-bold text-center">Health Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {paginatedLots.map(l => (
                  <tr key={l.lot_id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3.5 px-4 font-bold text-white">
                      <span className="group-hover:text-indigo-400 transition-colors">
                        Lot {l.lot_id}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center text-slate-200">
                      {l.total_components}
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium">
                      <span className={l.flagged > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {l.flagged}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-medium">
                      <span className={l.critical > 0 ? 'text-red-400 font-bold' : 'text-slate-400'}>
                        {l.critical}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        l.healthStatus === 'Critical' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : l.healthStatus === 'Needs Attention' 
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' 
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}>
                        {l.healthStatus === 'Critical' && <ShieldAlert className="w-3 h-3 mr-1" />}
                        {l.healthStatus === 'Needs Attention' && <AlertTriangle className="w-3 h-3 mr-1" />}
                        {l.healthStatus === 'Normal' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                        {l.healthStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => router.push(`/lot/${l.lot_id}`)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-[11px] font-medium inline-flex items-center space-x-1"
                      >
                        <span>View</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-white/5 flex items-center justify-between font-mono text-xs text-slate-400">
            <div>
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, filteredLots.length)} of {filteredLots.length} lots
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
