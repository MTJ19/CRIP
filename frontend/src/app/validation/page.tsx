"use client";
import React from 'react';
import { PageHeader } from '@/components/ui-crip';
import { CheckCircle2, AlertTriangle, FileText, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ValidationPage() {
  const router = useRouter();

  const checks = [
    { name: 'Required columns present', status: 'pass' },
    { name: 'Valid component IDs', status: 'pass' },
    { name: 'No duplicate components', status: 'pass' },
    { name: 'Checkpoint order valid (0h -> 168h)', status: 'pass' },
    { name: 'Numeric values valid', status: 'pass' },
    { name: 'Missing values check', status: 'warning', message: '3 components contain missing 96h measurements.' },
    { name: 'Temperature range (within spec)', status: 'pass' },
    { name: 'Voltage range (within spec)', status: 'pass' },
  ];

  return (
    <div className="p-8 max-w-6xl w-full mx-auto min-h-screen">
      <PageHeader 
        title="Dataset Validation" 
        subtitle="Review schema validation and data integrity checks before proceeding."
        context="Prototype • Synthetic demonstration data"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Dataset Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-4 flex items-center">
              <FileText className="w-4 h-4 mr-2 text-slate-400" />
              File Summary
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Filename</p>
                <p className="text-sm font-medium text-slate-900">lot_2026_00.csv</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Rows</p>
                  <p className="text-sm font-medium text-slate-900">500</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Lots</p>
                  <p className="text-sm font-medium text-slate-900">1</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Components</p>
                  <p className="text-sm font-medium text-slate-900">500</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Checkpoints</p>
                  <p className="text-sm font-medium text-slate-900">4</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Validation Checks */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-widest mb-6">Integrity Checks</h3>
            
            <div className="space-y-4 mb-8">
              {checks.map((check, i) => (
                <div key={i} className="flex items-start justify-between border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start space-x-3">
                    {check.status === 'pass' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                    )}
                    <div>
                      <p className={`text-sm font-bold ${check.status === 'pass' ? 'text-slate-700' : 'text-slate-900'}`}>
                        {check.name}
                      </p>
                      {check.message && (
                        <p className="text-sm text-slate-600 mt-1 font-medium bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-100 inline-block">
                          <span className="font-bold text-yellow-800 mr-2">WARNING:</span>
                          {check.message}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded-md ${
                      check.status === 'pass' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-100">
              <button 
                onClick={() => router.push('/upload')}
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-lg shadow-sm hover:bg-slate-50 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Replace Dataset</span>
              </button>
              <button 
                onClick={() => router.push('/dashboard')}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-lg shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <span>Continue with warnings</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
