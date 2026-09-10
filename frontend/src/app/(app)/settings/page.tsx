"use client";
import React from 'react';
import { TermHeader, TermBox } from '@/components/ui-terminal';

export default function ModelPerformancePage() {
  return (
    <div className="max-w-4xl mx-auto w-full font-mono text-sm">
      <TermHeader title="SYSTEM SETTINGS & PERFORMANCE" />

      <div className="mb-8 border border-yellow-800 bg-yellow-900/10 p-4 text-yellow-500 text-xs">
        [ DISCLAIMER ] Metrics shown are based on synthetic evaluation data and do not represent validated ISRO hardware performance.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TermBox title="ANOMALY DETECTION [v1.0.4]">
          <div className="space-y-4 text-slate-300 mt-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Recall</span>
              <span>0.962</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">Precision</span>
              <span>0.891</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">F1 Score</span>
              <span>0.925</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">PR-AUC</span>
              <span>0.941</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">FNR</span>
              <span className="text-green-500">0.038</span>
            </div>
          </div>
        </TermBox>

        <TermBox title="DRIFT PREDICTION [v2.1.0]">
          <div className="space-y-4 text-slate-300 mt-2">
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">MAE</span>
              <span>0.042</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">RMSE</span>
              <span>0.061</span>
            </div>
            <div className="flex justify-between border-b border-slate-800 pb-2">
              <span className="text-slate-500">R² Score</span>
              <span>0.884</span>
            </div>
            <div className="flex justify-between border-t border-slate-700 pt-4 mt-4 text-xs">
              <span className="text-slate-600">Training Set</span>
              <span className="text-slate-400">Synth_Demo_V4</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Last Retrained</span>
              <span className="text-slate-400">01-SEP-2026</span>
            </div>
          </div>
        </TermBox>
      </div>
    </div>
  );
}
