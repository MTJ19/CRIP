"use client";
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { GlassPanel, GlassHeader } from '@/components/ui-glass';
import { UploadCloud, FileEdit, ArrowRight, FileSpreadsheet, Check } from 'lucide-react';
import { api } from '@/services/api';

export default function UploadDataPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'upload' | 'manual'>('upload');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationStats, setValidationStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
      setValidationStats(null);
      setIsAnalyzing(true);
      try {
        const response = await api.uploadDataset(file);
        setValidationStats(response.stats);
      } catch (err: any) {
        setError(err.message || 'Failed to process file');
      } finally {
        setIsAnalyzing(false);
      }
    }
  };

  return (
    <div className="max-w-5xl mx-auto w-full h-full flex flex-col">
      <GlassHeader 
        title="Data Ingestion Pipeline" 
        subtitle="Upload component test data or manually input details for ML anomaly detection" 
      />

      <div className="flex space-x-4 mb-8">
        <button 
          onClick={() => setMode('upload')}
          className={`flex items-center px-6 py-3 rounded-xl border transition-all ${
            mode === 'upload' 
              ? 'bg-indigo-500/10 border-indigo-500/50 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
              : 'bg-[#1c1f26] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <UploadCloud className="w-5 h-5 mr-3" />
          Upload CSV Dataset
        </button>
        <button 
          onClick={() => setMode('manual')}
          className={`flex items-center px-6 py-3 rounded-xl border transition-all ${
            mode === 'manual' 
              ? 'bg-orange-500/10 border-orange-500/50 text-orange-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]' 
              : 'bg-[#1c1f26] border-white/5 text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <FileEdit className="w-5 h-5 mr-3" />
          Manual Entry
        </button>
      </div>

      <GlassPanel className="flex-1 flex flex-col p-8 relative overflow-hidden">
        {mode === 'upload' ? (
          <div className="flex-1 flex flex-col">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              className="hidden" 
              accept=".csv,.xlsx" 
            />
            
            <div 
              onClick={() => !isAnalyzing && fileInputRef.current?.click()}
              className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all cursor-pointer group ${
                isAnalyzing ? 'border-slate-500/20 bg-slate-500/5 cursor-wait' : 'border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10'
              }`}
            >
              <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <FileSpreadsheet className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-medium text-white mb-2">Upload Burn-In Data</h3>
              <p className="text-sm text-slate-400 max-w-md text-center mb-6">
                Drag & Drop CSV / Excel
              </p>
              <button disabled={isAnalyzing} className="bg-[#1c1f26] border border-white/10 hover:bg-white/10 text-white px-8 py-2.5 rounded-lg font-medium transition-colors">
                [ Choose File ]
              </button>
            </div>

            {/* Validation Results UI matching terminal screenshot */}
            {(selectedFile || error) && (
              <div className="mt-8 font-mono text-sm">
                <div className="text-slate-400 mb-1">File:</div>
                <div className="text-indigo-400 mb-6">{selectedFile?.name || 'Unknown'}</div>
                
                {isAnalyzing && <div className="text-slate-400 animate-pulse">Processing file with ML models...</div>}
                
                {error && <div className="text-red-400">Error: {error}</div>}

                {validationStats && (
                  <div className="space-y-2 text-slate-300">
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Schema validated</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> {validationStats.componentsDetected} components detected</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> {validationStats.checkpointsDetected} checkpoints detected</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> {validationStats.duplicateIds > 0 ? `${validationStats.duplicateIds} duplicates removed` : 'No duplicate IDs'}</div>
                    <div className="flex items-center"><Check className="w-4 h-4 mr-2 text-emerald-500" /> Missing values: {validationStats.missingValues.toFixed(1)}%</div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full pt-8">
            <h3 className="text-xl font-medium text-white mb-6">Component Project Details</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Project / Lot Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. LOT_2026_00" 
                  className="w-full bg-[#16181d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Component Type</label>
                <select className="w-full bg-[#16181d] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50 appearance-none">
                  <option>Aerospace Microcontroller (Class A)</option>
                  <option>Power Regulation Module</option>
                  <option>Telemetry Processor</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Target Burn-in Duration</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input type="radio" name="duration" className="text-orange-500 bg-[#16181d] border-white/10" />
                    <span>24 Hours</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input type="radio" name="duration" className="text-orange-500 bg-[#16181d] border-white/10" />
                    <span>96 Hours</span>
                  </label>
                  <label className="flex items-center space-x-2 text-slate-300">
                    <input type="radio" name="duration" defaultChecked className="text-orange-500 bg-[#16181d] border-white/10" />
                    <span>168 Hours</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Additional Metadata</label>
                <textarea 
                  rows={4}
                  placeholder="Enter any specific testing parameters or conditions..." 
                  className="w-full bg-[#16181d] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>
        )}

        {/* Action Bar */}
        <div className="mt-8 pt-8 border-t border-white/5 flex justify-end">
          <button 
            onClick={() => router.push('/')}
            disabled={!validationStats}
            className={`flex items-center px-8 py-3 rounded-xl font-medium transition-all ${
              !validationStats
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5' 
                : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.4)]'
            }`}
          >
            [ RUN ANALYSIS ]
          </button>
        </div>
      </GlassPanel>
    </div>
  );
}
