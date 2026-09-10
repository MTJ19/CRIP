"use client";
import React from 'react';
import { GlassPanel, GlassHeader } from '@/components/ui-glass';
import Link from 'next/link';
import { AlertCircle, FileWarning, ShieldAlert, Cpu } from 'lucide-react';

export default function RiskPage() {
  return (
    <div className="max-w-4xl mx-auto w-full">
      <GlassHeader title="Risk Assessment" subtitle="Final Evaluation for CMP-0427" />

      <GlassPanel className="p-8 mb-8 flex flex-col items-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-red-500/10 blur-[60px] rounded-full pointer-events-none"></div>

        <div className="flex flex-col items-center justify-center mb-8 z-10">
          <div className="w-24 h-24 rounded-full bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mb-4">
            <ShieldAlert className="w-12 h-12 text-orange-400" />
          </div>
          <div className="text-orange-400 text-4xl font-bold tracking-tight">HIGH RISK</div>
          <div className="text-slate-400 text-sm mt-2">Probability of latent failure: 94%</div>
        </div>
        
        <div className="w-full border-t border-white/5 pt-8 mt-2 z-10">
          <h3 className="text-lg font-medium text-white mb-4">Primary Factors Detected</h3>
          <div className="space-y-4 text-slate-300">
            <div className="bg-[#1c1f26] border border-white/5 p-4 rounded-xl flex items-start space-x-4">
              <div className="p-2 bg-orange-500/10 rounded-lg shrink-0 mt-0.5">
                <AlertCircle className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">Significant lot-relative anomaly</div>
                <div className="text-sm text-slate-400">Component deviates by 3.75σ from the lot baseline (LOT_2026_00).</div>
              </div>
            </div>
            
            <div className="bg-[#1c1f26] border border-white/5 p-4 rounded-xl flex items-start space-x-4">
              <div className="p-2 bg-yellow-500/10 rounded-lg shrink-0 mt-0.5">
                <TrendingUp className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <div className="text-white font-medium mb-1">Abnormal parameter drift</div>
                <div className="text-sm text-slate-400">Accelerating drift detected (+18.4% over 96 hours).</div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full border-t border-white/5 pt-8 mt-8 z-10">
          <h3 className="text-lg font-medium text-white mb-4">System Recommendation</h3>
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-xl flex items-start space-x-4">
            <Cpu className="w-6 h-6 text-indigo-400 shrink-0 mt-1" />
            <div>
              <div className="text-indigo-300 font-medium text-lg mb-2">Action Required: Flag for manual inspection</div>
              <div className="text-sm text-indigo-200/70 leading-relaxed">
                Component passes absolute specifications but exhibits high probability of latent defect based on lot peer comparison. Do not qualify for deployment without secondary manual screening.
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      <div className="flex justify-end">
        <Link 
          href="/reports"
          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 py-3 rounded-xl transition-colors font-medium flex items-center shadow-lg"
        >
          <FileWarning className="w-4 h-4 mr-2" />
          Generate QA Report
        </Link>
      </div>
    </div>
  );
}

// Just a quick dummy import for TrendingUp since I used it above
import { TrendingUp } from 'lucide-react';
