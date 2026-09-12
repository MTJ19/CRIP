"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui-glass';
import { ShieldAlert, AlertTriangle, Search, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function AlertsPage() {
  const router = useRouter();
  const { currentAnalysis } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');

  const alertsList = useMemo(() => {
    if (!currentAnalysis?.components) return [];
    return currentAnalysis.components.filter(c => c.risk_level === 'CRITICAL' || c.risk_level === 'HIGH');
  }, [currentAnalysis]);

  const filteredAlerts = useMemo(() => {
    let list = [...alertsList];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(a => 
        a.component_id.toLowerCase().includes(q) ||
        a.lot_id.toLowerCase().includes(q) ||
        (a.main_reason && a.main_reason.toLowerCase().includes(q))
      );
    }

    if (tierFilter !== 'ALL') {
      list = list.filter(a => a.risk_level === tierFilter);
    }

    // Critical first, then highest failure probability
    list.sort((a, b) => {
      if (a.risk_level === 'CRITICAL' && b.risk_level !== 'CRITICAL') return -1;
      if (b.risk_level === 'CRITICAL' && a.risk_level !== 'CRITICAL') return 1;
      return (b.future_failure_probability || 0) - (a.future_failure_probability || 0);
    });

    return list;
  }, [alertsList, searchTerm, tierFilter]);

  const criticalCount = alertsList.filter(a => a.risk_level === 'CRITICAL').length;
  const highCount = alertsList.filter(a => a.risk_level === 'HIGH').length;

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Priority Screening Alerts</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Flagged components exhibiting anomalous drift or out-of-family degradation requiring immediate quarantine or review.
          </p>
        </div>

        <div className="flex items-center space-x-2 font-mono text-xs">
          <span className="bg-red-500/15 text-red-300 border border-red-500/30 px-3 py-1.5 rounded-lg font-bold">
            {criticalCount} Critical Holds
          </span>
          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg font-bold">
            {highCount} High Risk
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search alerts by component ID, lot, or reason..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#171920] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          {(['ALL', 'CRITICAL', 'HIGH'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setTierFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                tierFilter === tab 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'bg-[#171920] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab === 'ALL' ? 'All Alerts' : tab === 'CRITICAL' ? 'Critical Only' : 'High Risk Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts Table */}
      <GlassPanel className="p-0 overflow-hidden">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center font-mono">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-500/20 text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No active alerts</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              All analyzed components are currently within configured monitoring criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Severity</th>
                  <th className="py-3 px-4 font-bold">Component ID</th>
                  <th className="py-3 px-4 font-bold">Lot</th>
                  <th className="py-3 px-4 font-bold text-center">Failure Prob</th>
                  <th className="py-3 px-4 font-bold">Primary Reason</th>
                  <th className="py-3 px-4 font-bold">Recommended Action</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAlerts.map(a => (
                  <tr key={a.component_id} className="hover:bg-white/5 transition-colors group">
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                        a.risk_level === 'CRITICAL' 
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                          : 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                      }`}>
                        {a.risk_level === 'CRITICAL' ? <ShieldAlert className="w-3 h-3 mr-1" /> : <AlertTriangle className="w-3 h-3 mr-1" />}
                        {a.risk_level}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      {a.component_id}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400">
                      Lot {a.lot_id}
                    </td>

                    <td className="py-3.5 px-4 text-center font-bold text-amber-400">
                      {a.future_failure_probability ? `${(a.future_failure_probability * 100).toFixed(1)}%` : '—'}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate" title={a.main_reason}>
                      {a.main_reason}
                    </td>

                    <td className="py-3.5 px-4 text-indigo-300 font-medium max-w-xs truncate" title={a.recommended_action}>
                      {a.recommended_action || (a.risk_level === 'CRITICAL' ? 'Immediate quarantine' : 'Secondary screening')}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => router.push(`/component/${a.component_id}`)}
                        className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-[11px] font-medium inline-flex items-center space-x-1"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

    </div>
  );
}
