import React from 'react';

export const RiskBadge = ({ risk }: { risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' }) => {
  const colors = {
    LOW: 'bg-green-50 text-green-700 border-green-200',
    MEDIUM: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
    CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${colors[risk]}`}>
      {risk}
    </span>
  );
};

export const StatusBadge = ({ status }: { status: string }) => {
  return (
    <span className="px-2.5 py-0.5 rounded-md text-xs font-medium border bg-slate-100 text-slate-700 border-slate-200">
      {status}
    </span>
  );
};

export const MetricCard = ({ title, value, subtitle, trend }: { title: string; value: string | number; subtitle?: string; trend?: 'up' | 'down' | 'neutral' }) => {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col justify-between">
      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{title}</h3>
      <div className="flex items-baseline space-x-2">
        <span className="text-2xl font-extrabold text-slate-800">{value}</span>
        {trend && (
          <span className={`text-xs font-bold ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-slate-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '−'}
          </span>
        )}
      </div>
      {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
    </div>
  );
};

export const PageHeader = ({ title, subtitle, context }: { title: string; subtitle: string; context?: string }) => {
  return (
    <div className="mb-8 border-b border-slate-200 pb-5">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{title}</h1>
          <p className="text-slate-500 mt-1 font-medium">{subtitle}</p>
        </div>
        {context && (
          <div className="bg-blue-50 border border-blue-100 text-blue-800 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center shadow-sm">
            {context}
          </div>
        )}
      </div>
    </div>
  );
};
