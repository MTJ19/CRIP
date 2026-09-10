import React from 'react';

export default function Page() {
  return (
    <div className="p-8 max-w-7xl w-full mx-auto flex flex-col items-center justify-center min-h-[60vh]">
      <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-100 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2 capitalize">analytics</h1>
        <p className="text-slate-500">This module is currently under development.</p>
      </div>
    </div>
  );
}
