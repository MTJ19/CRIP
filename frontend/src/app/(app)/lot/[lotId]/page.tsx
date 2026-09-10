"use client";
import React, { useEffect, useState, use } from 'react';
import { api } from '@/services/api';
import { Lot } from '@/data/demoLots';
import { ComponentDetails } from '@/data/demoComponents';
import { GlassPanel, GlassHeader, GlassBadge } from '@/components/ui-glass';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';

export default function LotPage({ params }: { params: Promise<{ lotId: string }> }) {
  const resolvedParams = use(params);
  const [lot, setLot] = useState<Lot | null>(null);
  const [components, setComponents] = useState<ComponentDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getLot(resolvedParams.lotId),
      api.getComponents(resolvedParams.lotId)
    ]).then(([l, c]) => {
      setLot(l || null);
      setComponents(c);
      setLoading(false);
    });
  }, [resolvedParams.lotId]);

  if (loading) return <div className="p-8 text-slate-500">Loading lot data...</div>;
  if (!lot) return <div className="p-8 text-slate-500">Lot not found</div>;

  return (
    <div className="max-w-6xl mx-auto w-full pb-10">
      <div className="flex justify-between items-start mb-8">
        <GlassHeader title={`Lot Analysis: ${lot.id}`} subtitle={`Checkpoint: ${lot.checkpoint}`} />
        <GlassBadge className="bg-orange-500/10 text-orange-400 border-orange-500/20 px-4 py-2">
          <AlertTriangle className="w-4 h-4 mr-2" />
          System Risk Detected
        </GlassBadge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Module Type</div>
          <div className="text-2xl font-medium text-white">{lot.componentType}</div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Total Monitored</div>
          <div className="text-2xl font-medium text-white">{lot.totalComponents}</div>
        </GlassPanel>
        <GlassPanel className="p-6">
          <div className="text-[10px] text-slate-500 uppercase tracking-widest mb-1">Flagged Anomalies</div>
          <div className="text-2xl font-medium text-orange-400">{lot.anomaliesCount}</div>
        </GlassPanel>
      </div>

      <GlassPanel className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h3 className="text-lg font-medium text-white">Component Risk Matrix</h3>
          <span className="text-[10px] bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-slate-400">Sorted by Anomaly Score</span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/5 text-slate-500 text-xs">
                <th className="pb-3 font-medium px-4">Identifier</th>
                <th className="pb-3 font-medium px-4">Anomaly Score</th>
                <th className="pb-3 font-medium px-4">Lot Z-Score</th>
                <th className="pb-3 font-medium px-4">Recent Drift</th>
                <th className="pb-3 font-medium px-4">Risk Level</th>
                <th className="pb-3 font-medium px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {components.map((comp) => (
                <tr key={comp.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-4">
                    <Link href={`/component/${comp.id}`} className="text-white font-medium group-hover:text-indigo-400 transition-colors">
                      {comp.id}
                    </Link>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-slate-300 w-8">{(comp.anomalyScore * 100).toFixed(0)}%</span>
                      <div className="w-16 h-1.5 bg-[#171920] rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${comp.anomalyScore > 0.8 ? 'bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : comp.anomalyScore > 0.6 ? 'bg-yellow-500' : 'bg-indigo-500'}`} 
                          style={{ width: `${comp.anomalyScore * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className={`py-4 px-4 ${comp.zScore > 3 ? 'text-orange-400 font-medium' : 'text-slate-400'}`}>
                    {comp.zScore > 0 ? '+' : ''}{comp.zScore.toFixed(2)}σ
                  </td>
                  <td className="py-4 px-4 text-slate-400">
                    {comp.drift > 0 ? '+' : ''}{comp.drift.toFixed(1)}%
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-xs px-2 py-1 rounded-md border ${
                      comp.risk === 'HIGH' || comp.risk === 'CRITICAL' 
                        ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' 
                        : comp.risk === 'MEDIUM' 
                        ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' 
                        : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                    }`}>
                      {comp.risk}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <Link href={`/component/${comp.id}`} className="text-indigo-400 hover:text-indigo-300 text-xs font-medium">
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassPanel>
    </div>
  );
}
