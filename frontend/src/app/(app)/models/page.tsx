"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { TrajectoryPoint } from '@/data/demoMeasurements';
import { TermHeader, TermBox } from '@/components/ui-terminal';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function DriftPredictionPage() {
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getTrajectory('CMP-0427', 'LOT_2026_00').then(t => {
      setTrajectory(t);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="p-8 text-slate-500 font-mono">LOADING_PREDICTIONS...</div>;

  return (
    <div className="max-w-4xl mx-auto w-full font-mono text-sm">
      <TermHeader title="168H PREDICTION ENGINE" />

      <TermBox title="ANOMALY & DRIFT FORECAST" className="p-8">
        <div className="flex justify-between items-start mb-8 border-b border-slate-700 pb-4">
          <div>
            <div className="text-slate-200 text-lg tracking-widest mb-1">TARGET: CMP-0427</div>
            <div className="text-slate-500 text-xs">Prediction is based on early burn-in measurements and lot-level features.</div>
          </div>
          <div className="text-right">
            <div className="text-slate-500 text-xs tracking-widest mb-1">PREDICTED 168H</div>
            <div className="text-slate-200 text-2xl font-bold">4.82</div>
            <div className="text-orange-500 text-xs mt-1">Approaching boundary</div>
          </div>
        </div>

        <div className="h-64 w-full relative pl-8 border border-slate-800 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
              <XAxis dataKey="time" axisLine={{ stroke: '#334155' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'monospace' }} dy={10} />
              <YAxis domain={['dataMin - 0.2', 'dataMax + 0.2']} axisLine={{ stroke: '#334155' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 12, fontFamily: 'monospace' }} width={30} />
              
              {/* Safety Line */}
              <ReferenceLine y={trajectory[0]?.safetyBoundary} stroke="#ef4444" strokeDasharray="3 3" />
              
              {/* Lines */}
              <Line type="linear" dataKey="lotAverage" stroke="#475569" strokeWidth={1} dot={false} activeDot={false} />
              <Line type="linear" dataKey="value" stroke="#e2e8f0" strokeWidth={1} dot={{ r: 3, fill: '#e2e8f0', strokeWidth: 0 }} activeDot={false} />
              {trajectory.some(t => t.predictedValue !== null) && (
                <Line type="linear" dataKey="predictedValue" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="4 4" dot={{ r: 3, fill: '#e2e8f0', strokeWidth: 0 }} activeDot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
          <div className="absolute top-4 right-4 text-xs space-y-1 text-slate-500">
            <div className="flex items-center space-x-2"><span className="w-2 h-0.5 bg-slate-200"></span><span>Observed</span></div>
            <div className="flex items-center space-x-2"><span className="w-2 h-0.5 bg-slate-200 border-t border-dashed border-slate-200"></span><span>Predicted</span></div>
            <div className="flex items-center space-x-2"><span className="w-2 h-0.5 bg-slate-600"></span><span>Lot Avg</span></div>
            <div className="flex items-center space-x-2"><span className="w-2 h-0.5 bg-red-500 border-t border-dashed border-red-500"></span><span>Safety Bndry</span></div>
          </div>
        </div>
      </TermBox>
    </div>
  );
}
