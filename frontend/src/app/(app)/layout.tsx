"use client";
import React from 'react';
import Sidebar from "@/components/Sidebar";
import TopBarTitle from "@/components/TopBarTitle";
import { AnalysisProvider } from "@/context/AnalysisContext";
import AnalysisContextIndicator from "@/components/AnalysisContextIndicator";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AnalysisProvider>
      <div className="flex min-h-screen w-full bg-[#0d0e12] text-slate-300">
        <Sidebar />
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar with Active Analysis Context */}
          <header className="h-20 flex flex-wrap items-center justify-between px-8 z-20 pt-4 border-b border-white/5 bg-[#0d0e12]/80 backdrop-blur-md">
            <div className="flex items-center space-x-6">
              <TopBarTitle />
              <div className="hidden md:flex items-center">
                <AnalysisContextIndicator />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2.5 bg-[#16181d] border border-white/10 rounded-full py-1 pr-3.5 pl-1.5 shadow-sm">
                <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-indigo-300 font-bold text-xs border border-indigo-500/30">
                  QA
                </div>
                <div className="text-left">
                  <div className="text-[9px] text-slate-400 font-mono font-medium leading-none">Reliability Eng</div>
                  <div className="text-xs text-white font-medium leading-tight">Burn-In QA Lead</div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </AnalysisProvider>
  );
}
