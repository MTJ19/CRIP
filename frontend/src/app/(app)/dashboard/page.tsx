"use client";
import React, { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Lot } from '@/data/demoLots';
import { GlassPanel, GlassBadge } from '@/components/ui-glass';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { Cpu, ShieldAlert, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';
import Image from 'next/image';

export default function OverviewPage() {
  const [lots, setLots] = useState<Lot[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getLots().then(data => {
      setLots(data);
      setLoading(false);
    });
  }, []);

  const componentsAnalyzed = lots.reduce((acc, lot) => acc + lot.totalComponents, 0);
  const totalFlagged = lots.reduce((acc, lot) => acc + lot.anomaliesCount, 0);
  
  // Dummy data for the bar chart
  const chartData = [
    { name: '0h', val1: 34.10, val2: 20.00 },
    { name: '24h', val1: 60.32, val2: 40.25 },
    { name: '96h', val1: 40.25, val2: 82.70 },
    { name: '168h', val1: 45.40, val2: 30.10 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full pb-8">
      
      {/* LEFT TALL PANEL: Component Monitor */}
      <GlassPanel className="lg:col-span-4 p-6 flex flex-col relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-6 z-10">
          <GlassBadge className="bg-white/5 border-white/10 text-white"><Cpu className="w-3 h-3 mr-1.5"/> Scanning</GlassBadge>
          <div className="flex space-x-1">
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
          </div>
        </div>

        {/* Component Visual Representation using Generated Image */}
        <div className="flex-1 flex flex-col items-center justify-center z-10 relative my-8">
          <div className="relative w-72 h-72 flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/20 to-indigo-500/20 rounded-full blur-[40px] mix-blend-screen"></div>
             <Image 
                src="/component.jpg" 
                alt="Semiconductor Component" 
                width={288} 
                height={288} 
                className="relative z-10 object-cover mix-blend-screen pointer-events-none"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 40%, transparent 70%)'
                }}
             />
             
             {/* Floating Stats */}
             <div className="absolute top-4 -right-4 text-left bg-[#1c1f26]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20 shadow-xl">
               <div className="text-[10px] text-slate-400">Peak anomaly</div>
               <div className="text-xl font-medium text-white">0.91<span className="text-sm text-slate-500 ml-1">σ</span></div>
             </div>
             <div className="absolute bottom-4 -left-4 text-right bg-[#1c1f26]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 z-20 shadow-xl">
               <div className="text-[10px] text-slate-400">Drift level</div>
               <div className="text-xl font-medium text-white">18.4<span className="text-sm text-slate-500 ml-1">%</span></div>
             </div>
          </div>
        </div>

        {/* Matrix Bottom Area */}
        <div className="bg-[#171920] rounded-xl p-4 z-10 border border-white/5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-white font-medium">Deviation matrix</span>
            <span className="text-[10px] text-slate-500 flex items-center cursor-pointer">Baseline <span className="ml-1">↓</span></span>
          </div>
          
          <div className="relative h-16 w-full flex items-center">
            {/* Horizontal Line */}
            <div className="absolute left-0 right-0 h-px bg-white/10 top-1/2"></div>
            {/* Dots */}
            <div className="w-full flex justify-between px-4 z-10">
              {[1,2,3,4,5,6].map((i) => (
                <div key={i} className="w-px h-6 bg-white/10 relative">
                  {i === 4 && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-orange-500/20"></div>}
                </div>
              ))}
            </div>
          </div>
          <div className="flex space-x-2 mt-4 h-1">
             <div className="flex-1 bg-white/5 rounded-full"></div>
             <div className="w-1/4 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
             <div className="flex-1 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
          </div>
        </div>
      </GlassPanel>


      {/* RIGHT SIDE PANELS */}
      <div className="lg:col-span-8 flex flex-col space-y-6">
        
        {/* TOP WIDE: Chart */}
        <GlassPanel className="p-6 h-[400px] flex flex-col">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-medium text-white mb-1">Anomaly rate by checkpoint</h2>
              <p className="text-xs text-slate-400">Measure parameter deviation to evaluate failure probability</p>
            </div>
            <GlassBadge className="bg-indigo-500/10 text-indigo-300 border-indigo-500/20">
              <div className="w-2 h-2 bg-indigo-400 rounded-sm mr-2"></div>
              System nominal
            </GlassBadge>
          </div>

          <div className="flex items-end space-x-8 mb-4">
            <div>
              <div className="text-3xl font-medium text-white">18.6<span className="text-lg text-slate-500 ml-1">%</span></div>
              <div className="text-[10px] text-slate-400 mt-1">Average yield deviation</div>
            </div>
            <button className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-lg text-xs font-medium text-slate-300 transition-colors">
              View report ↗
            </button>
          </div>

          <div className="flex-1 w-full min-h-0 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }} barGap={2}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff10" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ backgroundColor: '#1c1f26', borderColor: '#334155', borderRadius: '8px', color: '#fff' }} />
                
                <Bar dataKey="val1" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name="Parameter A">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-1-${index}`} fill={index === 1 ? '#6366f1' : '#4f46e5'} />
                  ))}
                </Bar>
                <Bar dataKey="val2" fill="#d97706" radius={[4, 4, 0, 0]} barSize={40} name="Parameter B">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-2-${index}`} fill={index === 2 ? '#f59e0b' : '#d97706'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassPanel>

        {/* BOTTOM ROW: Two Panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1">
          
          {/* Logs */}
          <GlassPanel className="p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-medium text-white">Identification log</h3>
              <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-slate-400">32 total</span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {/* Log Item 1 */}
              <div className="bg-[#171920] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-900/30 border border-orange-500/20 flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5">Component C-4291</div>
                    <div className="text-[10px] text-slate-500">Confirmed — Lot 12A</div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                </div>
              </div>

              {/* Log Item 2 */}
              <div className="bg-[#171920] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-900/30 border border-indigo-500/20 flex items-center justify-center shrink-0">
                    <Activity className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5">Parameter Drift</div>
                    <div className="text-[10px] text-slate-500">Confirmed — Layer 3</div>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                </div>
              </div>

              {/* Log Item 3 */}
              <div className="bg-[#171920] border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-900/30 border border-yellow-500/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white mb-0.5">Yield Variance</div>
                    <div className="text-[10px] text-slate-500 text-orange-400/80">Awaiting verification</div>
                  </div>
                </div>
              </div>
            </div>
          </GlassPanel>

          {/* Stats */}
          <GlassPanel className="p-6 flex flex-col relative overflow-hidden">
             {/* Glow */}
             <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 blur-[50px] rounded-full pointer-events-none"></div>

             <div className="flex justify-between items-center mb-6 z-10">
              <h3 className="text-lg font-medium text-white">Module spec</h3>
              <span className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-full text-slate-400">14 specs</span>
            </div>

            <div className="flex justify-between z-10 mb-6">
              <div>
                <div className="text-[10px] text-slate-500 mb-1">Rotation speed</div>
                <div className="text-xl font-medium text-white">1,850 <span className="text-sm text-slate-400">rpm</span></div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-500 mb-1">Coefficient drift</div>
                <div className="text-xl font-medium text-white">0.84 <span className="text-sm text-slate-400">μm</span></div>
              </div>
            </div>

            <div className="flex-1 border border-white/5 rounded-xl bg-[#171920] p-4 flex items-center justify-center z-10">
               {/* Small visual of module bottom */}
               <div className="relative w-32 h-32 flex items-center justify-center">
                  <div className="absolute w-full h-full rounded-full border border-dashed border-white/10 animate-[spin_10s_linear_infinite]"></div>
                  <div className="absolute w-24 h-24 rounded-full border border-indigo-500/30 flex items-center justify-center">
                    <div className="w-16 h-16 bg-gradient-to-tr from-slate-800 to-slate-600 rounded-full border border-white/20 flex items-center justify-center shadow-lg">
                      <div className="w-6 h-6 bg-orange-500 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.6)] border-2 border-white/50"></div>
                    </div>
                  </div>
               </div>
            </div>
          </GlassPanel>

        </div>

      </div>

    </div>
  );
}
