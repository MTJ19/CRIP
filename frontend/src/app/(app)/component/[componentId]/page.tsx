"use client";
import React, { useEffect, useState, use } from 'react';
import { api } from '@/services/api';
import { ComponentDetails } from '@/data/demoComponents';
import { TrajectoryPoint } from '@/data/demoMeasurements';
import { GlassPanel, GlassHeader, GlassBadge } from '@/components/ui-glass';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, Tooltip } from 'recharts';
import { AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';

export default function ComponentPage({ params }: { params: Promise<{ componentId: string }> }) {
  const resolvedParams = use(params);
  const [component, setComponent] = useState<ComponentDetails | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getComponent(resolvedParams.componentId, 'LOT_2026_00'),
      api.getTrajectory(resolvedParams.componentId, 'LOT_2026_00')
    ]).then(([c, t]) => {
      setComponent(c || null);
      setTrajectory(t);
      setLoading(false);
    });
  }, [resolvedParams.componentId]);

  if (loading) return <div className="p-8 text-slate-500">Loading module data...</div>;
  if (!component) return <div className="p-8 text-slate-500">Component not found</div>;

  return (
    <div className="max-w-6xl mx-auto w-full">
      <div className="mb-6 flex items-center space-x-4">
        <Link href={`/lot/${component.lotId}`} className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Back to Lot {component.lotId}
        </Link>
        <div className="h-4 w-px bg-white/10"></div>
        <GlassBadge className={`${
          component.risk === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
          component.risk === 'HIGH' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
          component.risk === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' :
          'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
        }`}>
          <AlertCircle className="w-3 h-3 mr-1.5" /> {component.risk} RISK
        </GlassBadge>
      </div>

      <GlassHeader title={`Component ${component.id}`} subtitle={`Lot ${component.lotId} — Type ${component.type}`} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Anomaly Score</div>
          <div className="text-3xl font-medium text-white">{(component.anomalyScore * 100).toFixed(0)}<span className="text-lg text-slate-500 ml-1">%</span></div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Current Trajectory</div>
          <div className="text-3xl font-medium text-white">{trajectory[2]?.value || '14.2'}</div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Predicted 168h</div>
          <div className="text-3xl font-medium text-white">{component.predicted168h}</div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Confidence Interval</div>
          <div className="text-3xl font-medium text-white">94<span className="text-lg text-slate-500 ml-1">%</span></div>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart */}
        <GlassPanel className="lg:col-span-2 p-6">
           <div className="flex justify-between items-start mb-6">
            <h3 className="text-lg font-medium text-white">Parameter Trajectory</h3>
            <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-slate-400">Drift Model</span>
          </div>
          
          <div className="h-80 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trajectory} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                <XAxis dataKey="time" axisLine={{ stroke: '#334155' }} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={30} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                
                <ReferenceLine y={trajectory[0]?.safetyBoundary} stroke="#ef4444" strokeDasharray="3 3" />
                
                <Line type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, fill: '#1c1f26', stroke: '#6366f1', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                {trajectory.some(t => t.predictedValue !== null) && (
                  <Line type="monotone" dataKey="predictedValue" stroke="#d97706" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, fill: '#1c1f26', stroke: '#d97706', strokeWidth: 2 }} activeDot={false} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* Factors */}
        <GlassPanel className="p-6 flex flex-col">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-white mb-1">Risk Factors</h3>
            <p className="text-[10px] text-slate-500">Why was this module flagged?</p>
          </div>

          <div className="space-y-4 flex-1">
            <div className="bg-[#171920] border border-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-white font-medium">Lot deviation</span>
              </div>
              <div className="text-2xl font-medium text-white ml-7">{component.zScore}σ <span className="text-xs text-slate-500 font-normal">from baseline</span></div>
            </div>

            <div className="bg-[#171920] border border-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-white font-medium">Accelerating drift</span>
              </div>
              <div className="text-sm text-slate-300 ml-7">Detected (+{component.drift}%)</div>
            </div>

            <div className="bg-[#171920] border border-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-white font-medium">Future prediction</span>
              </div>
              <div className="text-sm text-slate-300 ml-7">Above safety trajectory</div>
            </div>

            <div className="bg-[#171920] border border-white/5 rounded-xl p-4">
              <div className="flex items-center space-x-3 mb-2">
                <CheckCircle className="w-4 h-4 text-indigo-500" />
                <span className="text-sm text-white font-medium">Current absolute</span>
              </div>
              <div className="text-sm text-slate-300 ml-7">Within configured limits</div>
            </div>
          </div>
          
          <button className="w-full mt-6 bg-white/5 hover:bg-white/10 border border-white/10 py-3 rounded-xl text-sm font-medium text-white transition-colors">
            View full analysis report
          </button>
        </GlassPanel>
      </div>

    </div>
  );
}
