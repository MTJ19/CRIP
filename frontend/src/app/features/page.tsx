"use client";
import React from 'react';
import { PageHeader } from '@/components/ui-crip';
import { Cpu, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function FeaturesPage() {
  const processes = [
    { name: 'Lot-Level Aggregation', status: 'Complete' },
    { name: 'Drift Rate Calculation (0-24h, 24-96h)', status: 'Complete' },
    { name: 'Z-Score Normalization', status: 'Complete' },
    { name: 'Feature Vector Compilation', status: 'Complete' },
  ];

  return (
    <div className="p-8 max-w-4xl w-full mx-auto min-h-screen">
      <PageHeader 
        title="Feature Engineering" 
        subtitle="Processing raw measurements into model-ready features."
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm text-center mb-8">
        <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-10 h-10" />
        </div>
        
        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Processing Complete</h2>
        <p className="text-slate-500 font-medium mb-8">All 500 components have been successfully processed and vectorized.</p>
        
        <div className="max-w-md mx-auto bg-slate-50 border border-slate-200 rounded-xl p-5 text-left">
          <ul className="space-y-4">
            {processes.map((proc, i) => (
              <li key={i} className="flex items-center justify-between border-b border-slate-100 last:border-0 pb-3 last:pb-0">
                <span className="text-sm font-bold text-slate-700">{proc.name}</span>
                <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  {proc.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="flex justify-end">
        <Link 
          href="/models"
          className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>View Anomaly Detection</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
