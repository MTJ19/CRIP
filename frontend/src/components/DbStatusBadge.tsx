"use client";
import React from 'react';
import { Database, CheckCircle2, RefreshCw, AlertCircle, HardDrive } from 'lucide-react';
import { useAnalysis, DbStatusType } from '@/context/AnalysisContext';

export default function DbStatusBadge() {
  const { dbStatus, dbStatusMessage } = useAnalysis();

  const renderBadge = (type: DbStatusType) => {
    switch (type) {
      case 'connected':
        return (
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[11px]"
            title={dbStatusMessage}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <Database className="w-3 h-3 text-emerald-400" />
            <span className="font-medium">Database Connected</span>
          </div>
        );
      case 'saving':
        return (
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-[11px]"
            title="Ingesting and committing batch measurements..."
          >
            <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
            <span className="font-medium">Database Saving...</span>
          </div>
        );
      case 'saved':
        return (
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px]"
            title="Analysis and measurements safely persisted"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span className="font-medium">Database Saved</span>
          </div>
        );
      case 'local_storage':
        return (
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-500/10 border border-white/10 text-slate-400 font-mono text-[11px]"
            title="Backend offline — using local browser memory"
          >
            <HardDrive className="w-3 h-3 text-slate-400" />
            <span className="font-medium">Local Storage Active</span>
          </div>
        );
      case 'error':
      default:
        return (
          <div 
            className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[11px]"
            title={dbStatusMessage}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span className="font-medium">Database Offline</span>
          </div>
        );
    }
  };

  return renderBadge(dbStatus);
}
