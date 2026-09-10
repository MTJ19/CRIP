import React from 'react';

// Terminal Box
export const TermBox = ({ children, title, className = '' }: { children: React.ReactNode, title?: string, className?: string }) => {
  return (
    <div className={`border border-slate-700 relative p-4 bg-[#0a0a0a] ${className}`}>
      {title && (
        <div className="absolute -top-3 left-4 bg-[#0a0a0a] px-2 text-slate-400 text-xs tracking-widest uppercase">
          {title}
        </div>
      )}
      {children}
    </div>
  );
};

// Terminal KPI
export const TermKPI = ({ label, value }: { label: string, value: string | number }) => {
  return (
    <div className="border border-slate-700 rounded-full px-6 py-2 flex flex-col items-center justify-center relative">
      <div className="text-slate-500 text-[10px] uppercase tracking-widest absolute -top-2 bg-[#0a0a0a] px-1">{label}</div>
      <div className="text-slate-200 text-lg font-bold">{value}</div>
    </div>
  );
};

// Corner Bracket Wrapper
export const BracketBox = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => {
  return (
    <div className={`relative p-4 ${className}`}>
      {/* Top Left */}
      <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-slate-500"></div>
      {/* Top Right */}
      <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-slate-500"></div>
      {/* Bottom Left */}
      <div className="absolute bottom-0 left-0 w-3 h-3 border-b border-l border-slate-500"></div>
      {/* Bottom Right */}
      <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-slate-500"></div>
      {children}
    </div>
  );
}

// Terminal Header
export const TermHeader = ({ title }: { title: string }) => {
  return (
    <div className="text-slate-400 tracking-widest uppercase mb-8 pb-2 border-b border-slate-800">
      {title}
    </div>
  );
};
