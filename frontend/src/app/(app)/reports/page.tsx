"use client";
import React from 'react';
import { GlassPanel, GlassHeader } from '@/components/ui-glass';
import { FileText, Download, Eye, Layers, Activity, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ReportsPage() {
  const handleDemoExport = () => {
    alert("SYS_MSG: In a production environment, this would generate and download the requested file.");
  };

  return (
    <div className="max-w-5xl mx-auto w-full">
      <GlassHeader title="Analysis Reports" subtitle="Generated qualification reports and documentation" />

      <GlassPanel className="p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-white/5 pb-8 mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-xl font-medium text-white mb-1">LOT_2026_00_ANALYSIS.RPT</div>
              <div className="text-xs text-slate-400">Generated: 11-SEP-2026 01:53:25 UTC</div>
            </div>
          </div>
          <div className="flex space-x-3">
            <button onClick={handleDemoExport} className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
              <Eye className="w-4 h-4 mr-2" /> View
            </button>
            <button onClick={handleDemoExport} className="bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center">
              <Download className="w-4 h-4 mr-2" /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-[#1c1f26] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <Layers className="w-6 h-6 text-slate-400 mb-3" />
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Components</div>
            <div className="text-3xl font-medium text-white">500</div>
          </div>
          
          <div className="bg-[#1c1f26] border border-white/5 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <Activity className="w-6 h-6 text-indigo-400 mb-3" />
            <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Flagged Anomalies</div>
            <div className="text-3xl font-medium text-white">93</div>
          </div>
          
          <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
            <AlertCircle className="w-6 h-6 text-orange-400 mb-3" />
            <div className="text-[10px] text-orange-500/70 uppercase tracking-widest mb-1">High Risk</div>
            <div className="text-3xl font-medium text-orange-400">31</div>
          </div>
          
          <div className="bg-red-500/5 border border-red-500/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 blur-[30px] rounded-full pointer-events-none"></div>
            <ShieldAlert className="w-6 h-6 text-red-500 mb-3 z-10" />
            <div className="text-[10px] text-red-500/70 uppercase tracking-widest mb-1 z-10">Critical</div>
            <div className="text-3xl font-medium text-red-500 z-10">7</div>
          </div>
        </div>
      </GlassPanel>
    </div>
  );
}
