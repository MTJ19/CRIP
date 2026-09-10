"use client";
import React from 'react';
import { PageHeader } from '@/components/ui-crip';
import { BrainCircuit, FileCheck2 } from 'lucide-react';

export default function ExplainabilityPage() {
  const factors = [
    {
      rank: 1,
      name: 'LOT-RELATIVE DEVIATION',
      contribution: 'High contribution',
      color: 'bg-red-500',
      width: 'w-11/12',
      description: 'Measurement is approximately 3.75σ above the lot mean. The component behaves significantly differently from its immediate peers manufactured in the same batch.',
      type: 'MODEL EVIDENCE'
    },
    {
      rank: 2,
      name: 'RECENT DRIFT (96h)',
      contribution: 'High contribution',
      color: 'bg-orange-500',
      width: 'w-4/5',
      description: '96h → 168h drift (+18.4%) is unusually high relative to lot peers. The rate of degradation is accelerating compared to the normal component population.',
      type: 'MODEL EVIDENCE'
    },
    {
      rank: 3,
      name: 'PREDICTED TRAJECTORY',
      contribution: 'Moderate contribution',
      color: 'bg-yellow-500',
      width: 'w-3/5',
      description: 'Predicted 168h trajectory (4.82) is rapidly approaching the proposed safety boundary (4.90).',
      type: 'MODEL EVIDENCE'
    },
    {
      rank: 4,
      name: 'ABSOLUTE SPECIFICATION',
      contribution: 'Safe',
      color: 'bg-green-500',
      width: 'w-0', // Just a rule based check that passed
      description: 'Component is strictly within the absolute manufacturer tolerance limits.',
      type: 'RULE-BASED CHECK'
    }
  ];

  return (
    <div className="p-8 max-w-4xl w-full mx-auto min-h-screen">
      <PageHeader 
        title="Explainability: CMP-0427" 
        subtitle="Understand the AI model's decision logic and contributing risk factors."
        context="Why was this component flagged?"
      />

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Contributing Factors</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Factors are ranked by their impact on the final anomaly score (0.91).</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Final Risk</span>
            <span className="px-3 py-1 bg-orange-100 text-orange-800 border border-orange-200 rounded-lg text-sm font-bold">HIGH</span>
          </div>
        </div>

        <div className="space-y-8">
          {factors.map((factor) => (
            <div key={factor.rank} className="relative">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 rounded-md bg-slate-100 text-slate-600 font-bold flex items-center justify-center text-sm">
                    {factor.rank}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">{factor.name}</h3>
                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded flex items-center space-x-1 ${
                    factor.type === 'MODEL EVIDENCE' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                  }`}>
                    {factor.type === 'MODEL EVIDENCE' ? <BrainCircuit className="w-3 h-3 mr-1" /> : <FileCheck2 className="w-3 h-3 mr-1" />}
                    {factor.type}
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-500 uppercase">{factor.contribution}</span>
              </div>
              
              <div className="pl-9 mb-4">
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{factor.description}</p>
              </div>

              {factor.type === 'MODEL EVIDENCE' && (
                <div className="pl-9">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className={`h-full ${factor.color} ${factor.width} rounded-full`}></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
