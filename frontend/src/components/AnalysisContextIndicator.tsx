"use client";
import React, { useState } from 'react';
import { useAnalysis } from '@/context/AnalysisContext';
import { Layers, ChevronDown, Check, Sparkles, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AnalysisContextIndicator() {
  const { currentAnalysis, analysisId, filename, isSynthetic, analysesList, loadAnalysis } = useAnalysis();
  const [isOpen, setIsOpen] = useState(false);

  if (!currentAnalysis) {
    return (
      <Link 
        href="/upload" 
        className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 hover:bg-indigo-500/20 transition-colors text-xs font-mono"
      >
        <Layers className="w-3.5 h-3.5 text-indigo-400" />
        <span>No Active Analysis — Click to Upload</span>
      </Link>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3 py-1.5 rounded-lg bg-[#1c1f26] hover:bg-[#22252e] border border-white/10 text-xs font-mono text-slate-300 transition-all text-left"
        title="Active Analysis Dataset Context"
      >
        <div className="flex items-center space-x-1.5">
          <span className="text-slate-500 uppercase text-[10px] tracking-wider">Analysis:</span>
          <span className="text-white font-bold">{analysisId?.slice(0, 12)}</span>
        </div>

        <span className="text-slate-600">•</span>

        <div className="flex items-center space-x-1 max-w-[180px] truncate">
          <span className="text-slate-400 truncate">{filename}</span>
        </div>

        {isSynthetic && (
          <span className="bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.2 rounded text-[9px] font-bold tracking-wider uppercase flex items-center">
            <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-400" />
            SYNTHETIC DEMO DATA
          </span>
        )}

        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {/* Switcher Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute left-0 mt-2 w-80 bg-[#16181d] border border-white/10 rounded-xl shadow-2xl p-2 z-50 font-mono text-xs max-h-96 overflow-y-auto custom-scrollbar">
            <div className="px-3 py-2 border-b border-white/5 flex justify-between items-center text-[11px] text-slate-400 font-bold uppercase tracking-wider">
              <span>Switch Active Analysis</span>
              <Link 
                href="/history" 
                onClick={() => setIsOpen(false)}
                className="text-indigo-400 hover:text-indigo-300 text-[10px] flex items-center"
              >
                All History →
              </Link>
            </div>

            <div className="py-1 space-y-1">
              {analysesList.length === 0 ? (
                <div className="px-3 py-4 text-center text-slate-500 text-[11px]">
                  No past analyses saved yet.
                </div>
              ) : (
                analysesList.slice(0, 8).map(run => {
                  const isSelected = run.analysis_id === analysisId || run.id === analysisId;
                  return (
                    <button
                      key={run.id}
                      onClick={() => {
                        loadAnalysis(run.id || run.analysis_id);
                        setIsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-indigo-600/20 text-indigo-200 border border-indigo-500/30' : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold text-white text-[11px] flex items-center">
                          <span>{run.source_filename}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center space-x-2 mt-0.5">
                          <span className="text-indigo-400 font-semibold">{run.analysis_id.slice(0, 10)}</span>
                          <span>•</span>
                          <span>{run.total_components} parts</span>
                          <span>•</span>
                          <span className="flex items-center text-slate-400">
                            <Clock className="w-2.5 h-2.5 mr-0.5" />
                            {new Date(run.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-2 border-t border-white/5 px-2">
              <Link
                href="/upload"
                onClick={() => setIsOpen(false)}
                className="w-full text-center block py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-[11px] transition-colors"
              >
                + Ingest New Screening Run
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
