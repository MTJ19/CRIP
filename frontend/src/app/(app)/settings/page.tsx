"use client";
import React, { useState } from 'react';
import { GlassPanel } from '@/components/ui-glass';
import { Settings, Shield, Database, Cpu, Sliders, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAnalysis } from '@/context/AnalysisContext';

export default function SettingsPage() {
  const { dbStatus, dbStatusMessage } = useAnalysis();
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 pb-16 font-mono">
      
      {/* Header */}
      <div className="border-b border-white/5 pb-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-bold text-white tracking-tight">System & Screening Settings</h1>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Configure burn-in monitoring thresholds, screening checkpoints, and audit underlying model metadata.
        </p>
      </div>

      {/* Synthetic Benchmark Disclaimer (PART 15) */}
      <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-xl text-xs space-y-1">
        <div className="font-bold flex items-center">
          <AlertCircle className="w-4 h-4 mr-2 text-amber-400" />
          <span>SYNTHETIC BENCHMARK DEMO NOTICE</span>
        </div>
        <p className="text-[11px] text-slate-400">
          The models and evaluation scores in this system are trained on simulated IRF540N MOSFET degradation datasets for technical demonstration and do not represent validated ISRO flight operational hardware.
        </p>
      </div>

      {/* SECTION 1: DATASHEET SPECIFICATION LIMITS */}
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
          <Shield className="w-4 h-4 text-indigo-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Screening Specification Bounds (IRF540N)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-slate-400">RDS(on) Max Absolute Condition</div>
              <div className="text-[10px] text-slate-500 mt-0.5">VGS = 10V, ID = 16A, TJ = 25°C</div>
            </div>
            <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10">44.0 mΩ</span>
          </div>

          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-slate-400">VGS(th) Gate Conduction Band</div>
              <div className="text-[10px] text-slate-500 mt-0.5">VDS = VGS, ID = 250 µA</div>
            </div>
            <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10">2.0 – 4.0 V</span>
          </div>

          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-slate-400">IDSS Drain-Source Leakage Bound</div>
              <div className="text-[10px] text-slate-500 mt-0.5">VDS = 100V, VGS = 0V</div>
            </div>
            <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10">250 µA</span>
          </div>

          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 flex justify-between items-center">
            <div>
              <div className="text-slate-400">Screening Checkpoints</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Early Gate vs Qualification Horizon</div>
            </div>
            <span className="text-white font-bold bg-white/5 px-2.5 py-1 rounded border border-white/10">0h, 72h, 168h</span>
          </div>
        </div>
      </GlassPanel>

      {/* SECTION 2: DATABASE & STORAGE STATUS */}
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center space-x-2 border-b border-white/5 pb-3">
          <Database className="w-4 h-4 text-emerald-400" />
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Database & Persistence Architecture</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase">Connection Status</div>
            <div className="text-white font-bold flex items-center">
              <span className={`w-2 h-2 rounded-full mr-2 ${dbStatus === 'connected' || dbStatus === 'saved' ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
              {dbStatus === 'connected' || dbStatus === 'saved' ? 'Database Connected' : 'Local Storage Mode'}
            </div>
          </div>

          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase">Storage Engine</div>
            <div className="text-white font-bold">{dbStatusMessage}</div>
          </div>

          <div className="bg-[#171920] p-3.5 rounded-xl border border-white/5 space-y-1">
            <div className="text-slate-500 text-[10px] uppercase">Backend REST API</div>
            <div className="text-indigo-400 font-bold">http://localhost:8000/api</div>
          </div>
        </div>
      </GlassPanel>

      {/* SECTION 3: TECHNICAL & MODEL INFORMATION (COLLAPSIBLE) */}
      <GlassPanel className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Technical / Model Information</h2>
          </div>
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1"
          >
            <span>{showTechnicalDetails ? 'Collapse Details' : 'Expand Details'}</span>
            {showTechnicalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {showTechnicalDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 text-xs">
            {/* Anomaly Detection Model */}
            <div className="bg-[#171920] p-4 rounded-xl border border-white/5 space-y-3">
              <div className="text-white font-bold border-b border-white/5 pb-2 text-xs">
                Anomaly Detection: Isolation Forest + Lot Z-Scores
              </div>
              <div className="space-y-2 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Algorithm:</span>
                  <span className="text-slate-200">Isolation Forest (contamination=auto)</span>
                </div>
                <div className="flex justify-between">
                  <span>Scaling:</span>
                  <span className="text-slate-200">RobustScaler</span>
                </div>
                <div className="flex justify-between">
                  <span>Calibration:</span>
                  <span className="text-slate-200">1% Target FPR on validation lot</span>
                </div>
                <div className="flex justify-between">
                  <span>Test Precision / Recall:</span>
                  <span className="text-emerald-400 font-bold">84.4% / 95.0%</span>
                </div>
                <div className="flex justify-between">
                  <span>F1 Metric:</span>
                  <span className="text-emerald-400 font-bold">0.894</span>
                </div>
              </div>
            </div>

            {/* Future Drift Prediction Model */}
            <div className="bg-[#171920] p-4 rounded-xl border border-white/5 space-y-3">
              <div className="text-white font-bold border-b border-white/5 pb-2 text-xs">
                Future Degradation Model: HistGradientBoosting
              </div>
              <div className="space-y-2 text-slate-400 text-[11px]">
                <div className="flex justify-between">
                  <span>Algorithm:</span>
                  <span className="text-slate-200">HistGradientBoostingClassifier</span>
                </div>
                <div className="flex justify-between">
                  <span>Optimization:</span>
                  <span className="text-slate-200">Cost-minimization (5x penalty for missed failure)</span>
                </div>
                <div className="flex justify-between">
                  <span>ROC-AUC:</span>
                  <span className="text-emerald-400 font-bold">0.969</span>
                </div>
                <div className="flex justify-between">
                  <span>Test Precision / Recall:</span>
                  <span className="text-emerald-400 font-bold">87.3% / 87.3%</span>
                </div>
                <div className="flex justify-between">
                  <span>Model Pipeline Version:</span>
                  <span className="text-indigo-400 font-bold">sih_mosfet_ml_v2</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </GlassPanel>

    </div>
  );
}
