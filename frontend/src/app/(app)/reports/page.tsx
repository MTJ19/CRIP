"use client";
import React from 'react';
import { GlassPanel, GlassHeader } from '@/components/ui-glass';
import { FileText, Download, Eye, Layers, Activity, AlertCircle, ShieldAlert } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function ReportsPage() {
  const { currentAnalysis } = useAnalysis();

  const handleExportCSV = () => {
    if (!currentAnalysis?.components) return;
    const headers = "component_id,lot_id,risk_level,is_anomaly,rds_on_mohm,future_failure_probability,main_reason,recommended_action\n";
    const rows = currentAnalysis.components.map(c => 
      `"${c.component_id}","${c.lot_id}","${c.risk_level}",${c.is_anomaly},${c.rds_on_mohm || 0},${c.future_failure_probability || 0},"${c.main_reason}","${c.recommended_action}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${currentAnalysis.analysis_id}_qualification_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summ = currentAnalysis?.summary || {
    total_components: 1200,
    total_anomalies: 180,
    critical_risk_count: 61,
    high_risk_count: 119
  };

  const reportId = currentAnalysis ? `${currentAnalysis.analysis_id}_QUALIFICATION_SUMMARY.RPT` : 'LOT_SCREENING_REPORT.RPT';

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6 pb-16 font-mono">
      <GlassHeader title="Screening & Qualification Reports" subtitle="Formal component burn-in qualification records and compliance summaries" />

      <GlassPanel className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-lg font-bold text-white mb-0.5">{reportId}</div>
              <div className="text-xs text-slate-400">
                Source: {currentAnalysis?.filename || 'Active Dataset'} • Screening Gate: 72h
              </div>
            </div>
          </div>
          <div className="flex space-x-3 text-xs">
            <button 
              onClick={handleExportCSV} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center shadow-md"
            >
              <Download className="w-4 h-4 mr-2" /> Export Audit CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#171920] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <Layers className="w-5 h-5 text-slate-400 mb-2" />
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Components Analyzed</div>
            <div className="text-2xl font-bold text-white">{summ.total_components.toLocaleString()}</div>
          </div>
          
          <div className="bg-[#171920] border border-white/5 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <Activity className="w-5 h-5 text-amber-400 mb-2" />
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Needing Attention</div>
            <div className="text-2xl font-bold text-amber-400">{summ.total_anomalies}</div>
          </div>
          
          <div className="bg-amber-500/5 border border-amber-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-5 h-5 text-yellow-400 mb-2" />
            <div className="text-[10px] text-yellow-500 uppercase tracking-widest mb-1">High Risk</div>
            <div className="text-2xl font-bold text-yellow-400">{summ.high_risk_count}</div>
          </div>
          
          <div className="bg-red-500/5 border border-red-500/10 p-5 rounded-2xl flex flex-col items-center justify-center text-center">
            <ShieldAlert className="w-5 h-5 text-red-400 mb-2" />
            <div className="text-[10px] text-red-500 uppercase tracking-widest mb-1">Critical Holds</div>
            <div className="text-2xl font-bold text-red-400">{summ.critical_risk_count}</div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
