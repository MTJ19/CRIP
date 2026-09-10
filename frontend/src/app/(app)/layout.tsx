import Sidebar from "@/components/Sidebar";
import TopBarTitle from "@/components/TopBarTitle";
import { Search, Bell } from 'lucide-react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen w-full bg-[#121418] text-slate-300">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="h-20 flex items-center justify-between px-8 z-10 pt-4">
          <h1 className="text-2xl font-medium text-white tracking-tight flex items-center">
            <TopBarTitle />
          </h1>

          <div className="flex items-center space-x-6">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search materials..." 
                className="bg-[#1c1f26] border border-white/5 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-white/20 transition-colors w-64"
              />
            </div>

            <div className="flex items-center space-x-3">
              <button className="w-10 h-10 rounded-full bg-[#1c1f26] border border-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors relative">
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2.5 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
              </button>
              <div className="flex items-center space-x-3 bg-[#1c1f26] border border-white/5 rounded-full py-1.5 pr-4 pl-1.5 cursor-pointer hover:bg-[#22252e] transition-colors">
                <div className="w-8 h-8 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-medium border border-indigo-500/20">
                  A
                </div>
                <div className="text-left">
                  <div className="text-[10px] text-slate-500 font-medium leading-none mb-0.5">Admin User</div>
                  <div className="text-xs text-white font-medium leading-none">Alex Topson</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
