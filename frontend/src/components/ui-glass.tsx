import React from 'react';

export const GlassPanel = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-[#20232b] rounded-2xl border border-white/5 shadow-xl ${className}`}>
      {children}
    </div>
  );
};

export const GlassBadge = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`bg-indigo-500/10 text-indigo-300 px-3 py-1.5 rounded-lg border border-indigo-500/20 text-xs font-medium flex items-center ${className}`}>
      {children}
    </div>
  );
};

export const GlassHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-medium text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-slate-400 text-sm mt-1">{subtitle}</p>}
    </div>
  );
};
