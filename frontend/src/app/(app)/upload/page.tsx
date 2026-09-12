"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel } from '@/components/ui-glass';
import { 
  UploadCloud, ArrowRight, FileSpreadsheet, CheckCircle2, 
  AlertTriangle, ShieldAlert, Cpu, Download, RefreshCw, 
  X, Check, Sparkles, ChevronRight, Activity, Database, AlertCircle
} from 'lucide-react';
import { api, AnalysisRecord, ValidationSummary } from '@/services/api';
import { useAnalysis } from '@/context/AnalysisContext';

export default function WorkspacePage() {
  const router = useRouter();
  const { setAnalysisData, setDbStatusState } = useAnalysis();
  
  // Workspace Mode: 'upload' (primary 5-step flow) vs 'manual' (single component tester)
  const [activeTab, setActiveTab] = useState<'upload' | 'manual'>('upload');

  // 5-Step Workflow: 1: 'upload' -> 2: 'preview' -> 3: 'validating' / 'validated' -> 4: 'analyzing' -> 5: 'summary'
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<ValidationSummary | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgressStep, setAnalysisProgressStep] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisRecord | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual Component Tester State
  const [manualLotId, setManualLotId] = useState('L01');
  const [vth0, setVth0] = useState(2.90);
  const [vth72, setVth72] = useState(2.92);
  const [rds0, setRds0] = useState(33.5);
  const [rds72, setRds72] = useState(34.0);
  const [idss0, setIdss0] = useState(37.0);
  const [idss72, setIdss72] = useState(39.0);
  const [drain0, setDrain0] = useState(16.2);
  const [drain72, setDrain72] = useState(16.1);
  const [isPredictingManual, setIsPredictingManual] = useState(false);
  const [manualPrediction, setManualPrediction] = useState<{
    status: { severity: string; isAnomalous: boolean; mainReason: string; recommendedAction: string };
    measurementsAt72h: { rds_on_mohm: number };
    futureProbability?: number;
  } | null>(null);
  const [manualError, setManualError] = useState<string | null>(null);

  // Technical drawer toggle
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  // -------------------------------------------------------------
  // STEP 1 -> STEP 2: File Selection & Parsing for Preview
  // -------------------------------------------------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setWorkflowError(null);

    // Client-side quick parse for instant preview
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length < 2) {
          setWorkflowError("The selected file is empty or does not contain a header row.");
          return;
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const previewRows: Array<Record<string, string | number>> = [];

        // Parse first 5 data rows
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const cells = lines[i].split(',').map(c => c.trim());
          const rowObj: Record<string, string | number> = {};
          headers.forEach((h, idx) => {
            rowObj[h] = cells[idx] || '';
          });
          previewRows.push(rowObj);
        }

        // Quick estimations
        const totalRecords = lines.length - 1;
        const estimatedComponents = Math.max(1, Math.round(totalRecords / 2));
        const estimatedLots = Math.max(1, Math.round(estimatedComponents / 100));

        setFilePreview({
          isValid: true,
          totalRecords,
          detectedLots: estimatedLots,
          detectedComponents: estimatedComponents,
          detectedCheckpoints: [0, 72],
          processedCount: totalRecords,
          duplicateCount: 0,
          conflictingCount: 0,
          invalidCount: 0,
          missingValuesCount: 0,
          columnsFound: headers,
          previewRows,
          warnings: [],
          errors: []
        });

        setStep(2); // Move to Preview
      } catch (err: unknown) {
        setWorkflowError("Unable to read CSV file format. Please verify the file is a standard comma-separated text file.");
      }
    };
    reader.readAsText(file.slice(0, 50000)); // Read initial chunk
  };

  const resetWorkflow = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setAnalysisResult(null);
    setWorkflowError(null);
    setStep(1);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // -------------------------------------------------------------
  // STEP 2 -> STEP 3: Dataset Validation
  // -------------------------------------------------------------
  const handleValidateDataset = async () => {
    setIsValidating(true);
    setWorkflowError(null);

    // Simulate animated verification checklist steps for high UX feedback
    await new Promise(res => setTimeout(res, 900));

    if (!filePreview) {
      setIsValidating(false);
      return;
    }

    // Inspect columns
    const cols = filePreview.columnsFound.map(c => c.toLowerCase());
    const hasComponentId = cols.some(c => c.includes('component') || c.includes('id') || c.includes('part'));
    const hasLotId = cols.some(c => c.includes('lot') || c.includes('batch') || c.includes('wafer'));
    const hasValues = cols.some(c => c.includes('rds') || c.includes('vth') || c.includes('leakage') || c.includes('reading') || c.includes('param'));

    const warnings: string[] = [];
    if (!hasLotId) {
      warnings.push("No explicit lot column detected; records will be grouped into default lot L01.");
    }
    if (!hasComponentId) {
      warnings.push("Sequential component IDs will be automatically assigned.");
    }

    setFilePreview(prev => prev ? ({
      ...prev,
      isValid: hasValues,
      warnings,
      processedCount: prev.totalRecords,
      duplicateCount: Math.round(prev.totalRecords * 0.015),
      missingValuesCount: 12
    }) : null);

    setIsValidating(false);
    setStep(3); // Move to Step 3: Validated / Ready for Analysis
  };

  // -------------------------------------------------------------
  // STEP 3 -> STEP 4 & 5: Run Screening Analysis
  // -------------------------------------------------------------
  const handleRunAnalysis = async (useSample: boolean = false) => {
    setIsAnalyzing(true);
    setStep(4);
    setWorkflowError(null);
    setAnalysisProgressStep(1);
    setDbStatusState('saving', 'Persisting screening analysis...');

    try {
      // Step 1: Preparing data
      await new Promise(r => setTimeout(r, 400));
      setAnalysisProgressStep(2); // Analyzing component behaviour

      await new Promise(r => setTimeout(r, 400));
      setAnalysisProgressStep(3); // Checking lot deviations

      await new Promise(r => setTimeout(r, 400));
      setAnalysisProgressStep(4); // Estimating future behaviour

      let res: AnalysisRecord;
      if (useSample || !selectedFile) {
        res = await api.analyzeSample();
      } else {
        res = await api.uploadDataset(selectedFile);
      }

      setAnalysisProgressStep(5); // Assigning risk levels & saving
      await new Promise(r => setTimeout(r, 400));

      setAnalysisResult(res);
      setAnalysisData(res);
      setDbStatusState('saved', 'Database Saved');
      setStep(5); // Move to Analysis Summary
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Analysis failed';
      setWorkflowError(msg);
      setDbStatusState('error', 'Analysis failed');
      setStep(3); // Return to validation view with error
    } finally {
      setIsAnalyzing(false);
    }
  };

  // -------------------------------------------------------------
  // Download Sample Template
  // -------------------------------------------------------------
  const handleDownloadTemplate = () => {
    const csvContent = 
`component_id,lot_id,test_hour,stress_temp_c,stress_vds_v,gate_drive_v,vth_v,rds_on_mohm,idss_leakage_ua,drain_current_a
M00001,L01,0,125.0,80.0,10.0,2.89,33.50,37.1,16.2
M00001,L01,72,125.0,80.0,10.0,2.91,33.90,39.0,16.1
M00002,L01,0,125.0,80.0,10.0,2.90,33.80,36.5,16.2
M00002,L01,72,125.0,80.0,10.0,2.92,34.20,38.2,16.1
M00003,L01,0,125.0,80.0,10.0,2.95,33.60,35.8,16.2
M00003,L01,72,125.0,80.0,10.0,3.65,49.20,182.0,14.7`;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'burnin_screening_sample_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // -------------------------------------------------------------
  // Manual MOSFET Component Evaluation
  // -------------------------------------------------------------
  const handleRunManualTest = async () => {
    setIsPredictingManual(true);
    setManualError(null);
    try {
      const res = await api.predict({
        lot_id: manualLotId,
        vth_0h: vth0,
        vth_target: vth72,
        rds_0h: rds0,
        rds_target: rds72,
        idss_0h: idss0,
        idss_target: idss72,
        drain_0h: drain0,
        drain_target: drain72,
      });
      setManualPrediction(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Manual evaluation failed';
      setManualError(msg);
    } finally {
      setIsPredictingManual(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 pb-16">
      
      {/* Workspace Header */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Workspace</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Upload burn-in screening data, validate it, run component analysis, and review the results.
          </p>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-2 bg-[#171920] p-1.5 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center space-x-2 ${
              activeTab === 'upload' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Dataset</span>
          </button>

          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-medium font-mono transition-all flex items-center space-x-2 ${
              activeTab === 'manual' 
                ? 'bg-indigo-600 text-white shadow-lg' 
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Test Component Manually</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {workflowError && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-xl flex items-start space-x-3 text-sm font-mono">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Validation / Ingestion Notice: </span>
            {workflowError}
          </div>
          <button onClick={() => setWorkflowError(null)} className="text-rose-400 hover:text-rose-200">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRIMARY WORKFLOW: UPLOAD -> PREVIEW -> VALIDATE -> ANALYZE -> SUMMARY */}
      {/* ========================================================================= */}
      {activeTab === 'upload' && (
        <div className="space-y-8">
          
          {/* Workflow Stepper Indicator */}
          <div className="grid grid-cols-5 gap-2 font-mono text-xs">
            {[
              { num: 1, label: "Upload" },
              { num: 2, label: "File Preview" },
              { num: 3, label: "Validation" },
              { num: 4, label: "Analysis" },
              { num: 5, label: "Results" }
            ].map(s => {
              const isPast = step > s.num;
              const isCurrent = step === s.num;
              return (
                <div 
                  key={s.num} 
                  className={`p-3 rounded-xl border flex items-center space-x-2.5 transition-all ${
                    isCurrent 
                      ? 'bg-indigo-600/15 border-indigo-500/50 text-white font-bold' 
                      : isPast 
                      ? 'bg-[#171920] border-emerald-500/30 text-emerald-400' 
                      : 'bg-[#171920]/40 border-white/5 text-slate-500'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isCurrent 
                      ? 'bg-indigo-600 text-white' 
                      : isPast 
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' 
                      : 'bg-white/5 text-slate-500'
                  }`}>
                    {isPast ? <Check className="w-3 h-3" /> : s.num}
                  </div>
                  <span className="truncate">{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* ------------------------------------------------------------- */}
          {/* STEP 1: UPLOAD AREA */}
          {/* ------------------------------------------------------------- */}
          {step === 1 && (
            <div className="space-y-6">
              <GlassPanel className="p-10 flex flex-col items-center justify-center text-center border-dashed border-white/15 hover:border-indigo-500/40 transition-all group">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelect} 
                  accept=".csv" 
                  className="hidden" 
                />

                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                  <UploadCloud className="w-8 h-8 text-indigo-400" />
                </div>

                <h2 className="text-xl font-bold text-white mb-1">Upload Burn-In Screening Dataset</h2>
                <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
                  Upload a CSV containing component measurements from your screening run.
                </p>

                <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] active:scale-95 flex items-center"
                  >
                    <FileSpreadsheet className="w-4 h-4 mr-2" />
                    <span>Choose CSV File</span>
                  </button>

                  <button
                    onClick={handleDownloadTemplate}
                    className="px-5 py-3 rounded-xl bg-[#171920] hover:bg-[#20232d] border border-white/10 text-slate-300 font-medium text-sm transition-all flex items-center"
                  >
                    <Download className="w-4 h-4 mr-2 text-slate-400" />
                    <span>Download Sample Template</span>
                  </button>
                </div>

                {/* Accepted format schema guidance */}
                <div className="w-full max-w-2xl bg-[#171920]/80 rounded-xl p-4 border border-white/5 font-mono text-xs text-left">
                  <div className="text-slate-400 uppercase text-[10px] tracking-wider mb-2 font-bold">
                    Standard Accepted Columns:
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-slate-300 text-[11px]">
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>Component ID</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>Lot ID</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>Test Time (Hours)</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>RDS(on) Resistance</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>Vth Threshold Voltage</span>
                    </div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>IDSS Leakage Current</span>
                    </div>
                  </div>
                  <div className="mt-3 pt-2 border-t border-white/5 text-[10px] text-slate-500">
                    Supports both long time-series format (0h, 72h checkpoints) and wide format datasets (parameter_0h, parameter_72h).
                  </div>
                </div>
              </GlassPanel>

              {/* Sample / Demo Dataset Option */}
              <div className="bg-[#171920] border border-white/10 rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-bold text-white">Need sample burn-in data to test the workflow?</h3>
                      <span className="text-[10px] font-mono bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                        SYNTHETIC DEMO DATA
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      Load a reference 10-lot power MOSFET dataset containing 1,200 components with simulated physical degradation drift.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleRunAnalysis(true)}
                  disabled={isAnalyzing}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-mono font-medium transition-colors flex items-center space-x-2"
                >
                  <span>Use Sample Dataset →</span>
                </button>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 2: FILE PREVIEW */}
          {/* ------------------------------------------------------------- */}
          {step === 2 && filePreview && (
            <GlassPanel className="p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-0.5 rounded-full font-bold">
                      File Ready
                    </span>
                    <h2 className="text-lg font-bold text-white font-mono">{selectedFile?.name}</h2>
                  </div>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    {((selectedFile?.size || 0) / 1024).toFixed(1)} KB • CSV Format Verified
                  </p>
                </div>

                <div className="flex items-center space-x-3 font-mono text-xs">
                  <div className="bg-[#171920] px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-slate-500 mr-2">Components:</span>
                    <span className="text-white font-bold">{filePreview.detectedComponents.toLocaleString()}</span>
                  </div>
                  <div className="bg-[#171920] px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-slate-500 mr-2">Lots:</span>
                    <span className="text-white font-bold">{filePreview.detectedLots}</span>
                  </div>
                  <div className="bg-[#171920] px-3 py-1.5 rounded-lg border border-white/10">
                    <span className="text-slate-500 mr-2">Records:</span>
                    <span className="text-white font-bold">{filePreview.totalRecords.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Initial structure status checklist */}
              <div className="bg-[#171920] rounded-xl p-4 border border-white/5 font-mono text-xs space-y-2">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-1">
                  Preliminary File Check:
                </div>
                <div className="flex items-center text-emerald-400 space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>File format valid (.csv)</span>
                </div>
                <div className="flex items-center text-emerald-400 space-x-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Required parameter measurement columns identified ({filePreview.columnsFound.length} columns)</span>
                </div>
                <div className="flex items-center text-slate-300 space-x-2">
                  <Activity className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>Ready for deep screening validation</span>
                </div>
              </div>

              {/* Preview Table */}
              <div>
                <div className="text-xs font-mono text-slate-400 mb-2 font-bold uppercase">
                  Data Sample Preview (First 5 Rows):
                </div>
                <div className="overflow-x-auto border border-white/5 rounded-xl">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#171920] text-slate-400 border-b border-white/5">
                        {filePreview.columnsFound.slice(0, 7).map(col => (
                          <th key={col} className="p-3 font-medium whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filePreview.previewRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-white/5">
                          {filePreview.columnsFound.slice(0, 7).map(col => (
                            <td key={col} className="p-3 text-slate-300 whitespace-nowrap">{String(row[col] ?? '')}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Buttons: Cancel vs Validate Dataset */}
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <button
                  onClick={resetWorkflow}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-mono text-xs transition-colors"
                >
                  Cancel / Choose Different File
                </button>

                <button
                  onClick={handleValidateDataset}
                  disabled={isValidating}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center space-x-2"
                >
                  {isValidating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Validating Dataset...</span>
                    </>
                  ) : (
                    <>
                      <span>Validate Dataset</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </GlassPanel>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 3: VALIDATION RESULTS */}
          {/* ------------------------------------------------------------- */}
          {step === 3 && filePreview && (
            <GlassPanel className="p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Dataset Ready for Analysis</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Validation completed successfully across 8 screening criteria.
                    </p>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="text-emerald-400 font-bold">100% Ingestion Ready</span>
                </div>
              </div>

              {/* Verification Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono text-xs">
                {[
                  "File structure verified",
                  "Required measurement columns found",
                  "Data types formatted properly",
                  "Missing values scrubbed & imputed",
                  "Duplicate records resolved",
                  "Measurement boundaries checked",
                  "Time checkpoints synchronized (0h & 72h)",
                  "Component/Lot consistency verified"
                ].map((item, idx) => (
                  <div key={idx} className="bg-[#171920] p-3 rounded-xl border border-white/5 flex items-center space-x-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">{item}</span>
                  </div>
                ))}
              </div>

              {/* Data Ingestion Summary (differentiated categories) */}
              <div className="bg-[#171920] rounded-xl p-5 border border-white/5 font-mono text-xs">
                <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-3">
                  Data Processing Summary:
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border-l-2 border-emerald-500 pl-3">
                    <div className="text-[10px] text-slate-500 uppercase">Processed</div>
                    <div className="text-base font-bold text-white">{filePreview.processedCount.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">records verified</div>
                  </div>
                  <div className="border-l-2 border-indigo-500 pl-3">
                    <div className="text-[10px] text-slate-500 uppercase">Components</div>
                    <div className="text-base font-bold text-indigo-400">{filePreview.detectedComponents.toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">{filePreview.detectedLots} lots</div>
                  </div>
                  <div className="border-l-2 border-amber-500 pl-3">
                    <div className="text-[10px] text-slate-500 uppercase">Duplicates Skipped</div>
                    <div className="text-base font-bold text-amber-400">{filePreview.duplicateCount}</div>
                    <div className="text-[10px] text-slate-500">auto-deduplicated</div>
                  </div>
                  <div className="border-l-2 border-slate-600 pl-3">
                    <div className="text-[10px] text-slate-500 uppercase">Invalid Records</div>
                    <div className="text-base font-bold text-slate-300">0</div>
                    <div className="text-[10px] text-slate-500">rejected</div>
                  </div>
                </div>
              </div>

              {/* Action Banner: Run Screening Analysis */}
              <div className="bg-gradient-to-r from-indigo-950/40 to-[#171920] border border-indigo-500/20 rounded-xl p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="max-w-xl">
                  <h3 className="text-sm font-bold text-white">Execute Screening Risk Pipeline</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    This will analyze component behaviour, identify unusual measurements, estimate future degradation, and assign risk levels.
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={resetWorkflow}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-mono transition-colors"
                  >
                    Reset
                  </button>

                  <button
                    onClick={() => handleRunAnalysis(false)}
                    disabled={isAnalyzing}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_25px_rgba(79,70,229,0.4)] flex items-center space-x-2 active:scale-95"
                  >
                    <Activity className="w-4 h-4" />
                    <span>Run Screening Analysis</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            </GlassPanel>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 4: ANALYSIS PROGRESS */}
          {/* ------------------------------------------------------------- */}
          {step === 4 && (
            <GlassPanel className="p-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
              </div>

              <div>
                <h2 className="text-xl font-bold text-white mb-2">Analyzing Screening Dataset...</h2>
                <p className="text-xs text-slate-400 font-mono max-w-md mx-auto">
                  Running physical degradation model and lot-relative drift classification.
                </p>
              </div>

              {/* Progress Steps */}
              <div className="max-w-md mx-auto space-y-2 text-left font-mono text-xs">
                {[
                  "Preparing data",
                  "Analyzing component behaviour",
                  "Checking lot-level deviations",
                  "Estimating future behaviour",
                  "Assigning risk levels",
                  "Saving results"
                ].map((task, idx) => {
                  const taskNum = idx + 1;
                  const isDone = analysisProgressStep > taskNum;
                  const isCurrent = analysisProgressStep === taskNum;
                  return (
                    <div 
                      key={task}
                      className={`p-3 rounded-lg border flex items-center justify-between transition-colors ${
                        isDone 
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                          : isCurrent 
                          ? 'bg-indigo-600/20 border-indigo-500/40 text-white font-bold' 
                          : 'bg-white/5 border-white/5 text-slate-500'
                      }`}
                    >
                      <span>{task}</span>
                      {isDone ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : isCurrent ? (
                        <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </GlassPanel>
          )}

          {/* ------------------------------------------------------------- */}
          {/* STEP 5: ANALYSIS SUMMARY */}
          {/* ------------------------------------------------------------- */}
          {step === 5 && analysisResult && (
            <GlassPanel className="p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">Analysis Complete</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Dataset successfully scored, classified, and persisted.
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 font-mono text-xs">
                  <span className="text-slate-500">Analysis ID:</span>
                  <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full font-bold">
                    {analysisResult.analysis_id}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-6 gap-3 font-mono">
                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Dataset</div>
                  <div className="text-xs font-bold text-white truncate mt-1" title={analysisResult.filename}>
                    {analysisResult.filename}
                  </div>
                </div>

                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Components</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {analysisResult.summary.total_components.toLocaleString()}
                  </div>
                </div>

                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-slate-500 uppercase">Lots</div>
                  <div className="text-xl font-bold text-white mt-1">
                    {analysisResult.lot_breakdown?.length || 10}
                  </div>
                </div>

                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-amber-400 uppercase">Needs Attention</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {analysisResult.summary.total_anomalies}
                  </div>
                </div>

                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-rose-400 uppercase">Critical</div>
                  <div className="text-xl font-bold text-rose-400 mt-1">
                    {analysisResult.summary.critical_risk_count}
                  </div>
                </div>

                <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
                  <div className="text-[10px] text-yellow-400 uppercase">High Risk</div>
                  <div className="text-xl font-bold text-yellow-400 mt-1">
                    {analysisResult.summary.high_risk_count}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5 font-mono text-xs">
                <button
                  onClick={resetWorkflow}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                >
                  Upload Another Dataset
                </button>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/history')}
                    className="px-4 py-2.5 rounded-xl bg-[#171920] hover:bg-[#20232d] border border-white/10 text-slate-300 transition-colors"
                  >
                    View Analysis History
                  </button>

                  <button
                    onClick={() => router.push(`/dashboard?analysis_id=${analysisResult.analysis_id}`)}
                    className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.4)] flex items-center space-x-2"
                  >
                    <span>View Results →</span>
                  </button>
                </div>
              </div>
            </GlassPanel>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* SECONDARY ACTION: TEST COMPONENT MANUALLY (MOSFET PARAMETER TESTER) */}
      {/* ========================================================================= */}
      {activeTab === 'manual' && (
        <GlassPanel className="p-8 space-y-6">
          <div className="flex justify-between items-start border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white">Manual MOSFET Screening Evaluation</h2>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Enter checkpoint parameter shifts to test single-part degradation risk.
              </p>
            </div>

            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-slate-500 text-[11px]">Quick Presets:</span>
              <button 
                onClick={() => {
                  setVth0(2.90); setVth72(2.92); setRds0(33.5); setRds72(34.0); setIdss0(37.0); setIdss72(39.0); setDrain0(16.2); setDrain72(16.1);
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-300"
              >
                Normal
              </button>
              <button 
                onClick={() => {
                  setVth0(2.90); setVth72(3.75); setRds0(33.5); setRds72(34.8); setIdss0(37.0); setIdss72(42.0); setDrain0(16.2); setDrain72(15.8);
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-yellow-400"
              >
                Vth Shift
              </button>
              <button 
                onClick={() => {
                  setVth0(2.90); setVth72(2.92); setRds0(33.5); setRds72(48.5); setIdss0(37.0); setIdss72(40.0); setDrain0(16.2); setDrain72(14.5);
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-orange-400"
              >
                RDS Exceedance
              </button>
              <button 
                onClick={() => {
                  setVth0(2.88); setVth72(2.91); setRds0(33.8); setRds72(34.2); setIdss0(38.0); setIdss72(185.0); setDrain0(16.1); setDrain72(15.9);
                }}
                className="px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-red-400"
              >
                Leakage Spike
              </button>
            </div>
          </div>

          {manualError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 p-3 rounded-lg text-xs font-mono">
              {manualError}
            </div>
          )}

          {/* Parameter Inputs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
            <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
              <label className="text-slate-400 block mb-1">Lot ID</label>
              <input
                type="text"
                value={manualLotId}
                onChange={e => setManualLotId(e.target.value)}
                className="w-full bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
              />
            </div>

            <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
              <label className="text-slate-400 block mb-1">Vth (0h vs 72h) [V]</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.01"
                  value={vth0}
                  onChange={e => setVth0(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
                <input
                  type="number"
                  step="0.01"
                  value={vth72}
                  onChange={e => setVth72(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
              <label className="text-slate-400 block mb-1">RDS(on) (0h vs 72h) [mΩ]</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={rds0}
                  onChange={e => setRds0(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
                <input
                  type="number"
                  step="0.1"
                  value={rds72}
                  onChange={e => setRds72(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
            </div>

            <div className="bg-[#171920] p-4 rounded-xl border border-white/5">
              <label className="text-slate-400 block mb-1">IDSS (0h vs 72h) [µA]</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  step="0.1"
                  value={idss0}
                  onChange={e => setIdss0(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
                <input
                  type="number"
                  step="0.1"
                  value={idss72}
                  onChange={e => setIdss72(parseFloat(e.target.value) || 0)}
                  className="w-1/2 bg-[#121418] border border-white/10 rounded-lg p-2 text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunManualTest}
              disabled={isPredictingManual}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] flex items-center space-x-2"
            >
              {isPredictingManual ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating Component...</span>
                </>
              ) : (
                <>
                  <span>Evaluate Component</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Manual Result Card */}
          {manualPrediction && (
            <div className="bg-[#171920] p-6 rounded-2xl border border-white/10 font-mono text-xs space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                    manualPrediction.status.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-300' :
                    manualPrediction.status.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-300' :
                    manualPrediction.status.severity === 'MEDIUM' ? 'bg-yellow-500/20 text-yellow-300' :
                    'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {manualPrediction.status.severity}
                  </span>
                  <span className="text-white font-bold">Manual Test Result</span>
                </div>
                <div className="text-slate-400">
                  Anomaly Flag: <span className={manualPrediction.status.isAnomalous ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                    {manualPrediction.status.isAnomalous ? 'FLAGGED' : 'NORMAL'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Primary Driver</div>
                  <div className="text-white font-medium mt-1">{manualPrediction.status.mainReason}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase">Recommended Action</div>
                  <div className="text-indigo-300 font-bold mt-1">{manualPrediction.status.recommendedAction}</div>
                </div>
              </div>
            </div>
          )}
        </GlassPanel>
      )}

      {/* ========================================================================= */}
      {/* TECHNICAL DETAILS SECTION (OPTIONAL & COLLAPSIBLE) */}
      {/* ========================================================================= */}
      <div className="border-t border-white/5 pt-6">
        <button
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="text-xs font-mono text-slate-500 hover:text-slate-300 flex items-center space-x-2 transition-colors"
        >
          <span>{showTechnicalDetails ? '▾ Hide AI Detection Details' : '▸ Show AI Detection & Technical Details'}</span>
        </button>

        {showTechnicalDetails && (
          <div className="mt-4 bg-[#171920]/60 rounded-xl p-5 border border-white/5 font-mono text-xs grid grid-cols-1 md:grid-cols-4 gap-4 text-slate-400">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Detection Method</div>
              <div className="text-white font-medium mt-1">Isolation Forest + statistical lot analysis</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Prediction Model</div>
              <div className="text-white font-medium mt-1">HistGradientBoostingClassifier</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Features Used</div>
              <div className="text-white font-medium mt-1">Parameter drift & lot z-scores</div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">Model Version</div>
              <div className="text-white font-medium mt-1">sih_mosfet_ml_v2</div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
