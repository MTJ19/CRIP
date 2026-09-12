"use client";
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui-glass';
import { History, Search, ArrowRight, Clock, FileSpreadsheet, RefreshCw, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';
import { HistoricalRun } from '@/services/api';

export default function AnalysisHistoryPage() {
  const router = useRouter();
  const { analysesList, loadAnalysis, isLoading, refreshAnalysesList } = useAnalysis();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Completed' | 'Processing' | 'Failed'>('ALL');
  const [loadingRunId, setLoadingRunId] = useState<string | null>(null);

  const filteredRuns = useMemo(() => {
    let list = [...analysesList];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(r => 
        r.analysis_id.toLowerCase().includes(q) ||
        r.source_filename.toLowerCase().includes(q) ||
        (r.triggered_by && r.triggered_by.toLowerCase().includes(q))
      );
    }

    if (statusFilter !== 'ALL') {
      list = list.filter(r => r.status === statusFilter);
    }

    return list;
  }, [analysesList, searchTerm, statusFilter]);

  const handleOpenAnalysis = async (run: HistoricalRun) => {
    const targetId = run.id || run.analysis_id;
    setLoadingRunId(targetId);
    const success = await loadAnalysis(targetId);
    setLoadingRunId(null);
    if (success) {
      router.push(`/dashboard?analysis_id=${targetId}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 pb-16">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">Analysis History</h1>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Access past screening runs. Opening a historical run retrieves stored results without re-executing ML scoring.
          </p>
        </div>

        <button
          onClick={() => refreshAnalysesList()}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs border border-white/10 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Run History</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search analyses by ID, dataset filename..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#171920] border border-white/10 rounded-xl pl-9 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-2">
          {(['ALL', 'Completed', 'Processing', 'Failed'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                statusFilter === tab 
                  ? 'bg-indigo-600 text-white font-bold' 
                  : 'bg-[#171920] text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab === 'ALL' ? 'All Runs' : tab}
            </button>
          ))}
        </div>
      </div>

      {/* History Table */}
      <GlassPanel className="p-0 overflow-hidden">
        {filteredRuns.length === 0 ? (
          <div className="p-12 text-center font-mono">
            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-500">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">No previous analyses</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
              Completed burn-in analyses will appear here. You can upload a new screening dataset to begin.
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
            >
              Upload Dataset →
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#171920] text-slate-400 border-b border-white/5 uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4 font-bold">Analysis ID</th>
                  <th className="py-3 px-4 font-bold">Dataset</th>
                  <th className="py-3 px-4 font-bold">Date</th>
                  <th className="py-3 px-4 font-bold text-center">Components</th>
                  <th className="py-3 px-4 font-bold text-center">Lots</th>
                  <th className="py-3 px-4 font-bold text-center">Risk (Crit/High)</th>
                  <th className="py-3 px-4 font-bold text-center">Status</th>
                  <th className="py-3 px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredRuns.map(run => {
                  const isOpening = loadingRunId === (run.id || run.analysis_id);
                  const totalRisk = run.critical_risk_count + run.high_risk_count;
                  return (
                    <tr key={run.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <span className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded text-[11px]">
                          {run.analysis_id.slice(0, 10)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 max-w-[200px] truncate" title={run.source_filename}>
                        {run.source_filename}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {new Date(run.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-200">
                        {run.total_components.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-center text-slate-400">
                        {run.total_lots}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          run.critical_risk_count > 0 
                            ? 'bg-red-500/20 text-red-300' 
                            : run.high_risk_count > 0 
                            ? 'bg-amber-500/20 text-amber-300' 
                            : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {run.critical_risk_count} crit / {run.high_risk_count} high
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-400" />
                          Completed
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenAnalysis(run)}
                          disabled={isOpening}
                          className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors text-[11px] font-medium inline-flex items-center space-x-1"
                        >
                          {isOpening ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <span>View</span>
                              <ArrowRight className="w-3 h-3" />
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </GlassPanel>

    </div>
  );
}
