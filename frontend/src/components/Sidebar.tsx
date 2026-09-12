"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Layers, Cpu, FileText, Settings, Briefcase, History, ShieldAlert } from 'lucide-react';
import { RoboticArmIcon } from './RoboticArmIcon';

export default function Sidebar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  const navItems = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Workspace', href: '/upload', icon: Briefcase },
    { name: 'Analysis History', href: '/history', icon: History },
    { name: 'Lots', href: '/lot', icon: Layers },
    { name: 'Components', href: '/component', icon: Cpu },
    { name: 'Alerts', href: '/alerts', icon: ShieldAlert },
    { name: 'Reports', href: '/reports', icon: FileText },
  ];

  return (
    <aside 
      className={`h-screen sticky top-0 flex flex-col py-6 bg-[#16181d] border-r border-white/5 z-50 transition-all duration-300 ease-in-out shrink-0 ${
        isExpanded ? 'w-64 items-start px-6 shadow-2xl' : 'w-16 items-center px-0'
      }`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      aria-label="Main Navigation"
    >
      <div className={`mb-8 flex items-center justify-center ${isExpanded ? 'w-full justify-start' : 'w-full'}`}>
        <Link href="/" className="flex items-center group">
          <div className="shrink-0 flex items-center justify-center">
            <RoboticArmIcon className="w-10 h-10" />
          </div>
          {isExpanded && (
            <span className="ml-3 font-bold text-white tracking-widest text-base group-hover:text-indigo-400 transition-colors">
              CRIP
            </span>
          )}
        </Link>
      </div>

      <nav className="flex-1 flex flex-col space-y-2.5 w-full">
        {navItems.map((item) => {
          let isActive = false;
          if (item.href === '/dashboard') {
            isActive = pathname === '/dashboard' || pathname === '/';
          } else {
            isActive = pathname.startsWith(item.href);
          }

          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={isExpanded ? '' : item.name}
              className={`h-10 rounded-xl flex items-center transition-all overflow-hidden ${
                isExpanded ? 'w-full px-3' : 'w-10 justify-center'
              } ${
                isActive 
                  ? 'bg-indigo-600/15 text-white shadow-inner border border-indigo-500/30' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} strokeWidth={isActive ? 2.5 : 2} />
              {isExpanded && <span className="ml-3 text-sm font-medium whitespace-nowrap">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col space-y-2 w-full">
        <Link
          href="/settings"
          title={isExpanded ? '' : 'Settings'}
          className={`h-10 rounded-xl flex items-center transition-all overflow-hidden ${
            isExpanded ? 'w-full px-3' : 'w-10 justify-center'
          } ${
            pathname.startsWith('/settings')
              ? 'bg-white/10 text-white border border-white/15'
              : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
          }`}
        >
          <Settings className="w-5 h-5 shrink-0" />
          {isExpanded && <span className="ml-3 text-sm font-medium whitespace-nowrap">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
