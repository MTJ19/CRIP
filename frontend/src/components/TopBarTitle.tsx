"use client";
import { usePathname } from 'next/navigation';

export default function TopBarTitle() {
  const pathname = usePathname();
  
  let title = "Overview";
  if (pathname === '/upload') title = "Workspace";
  else if (pathname.startsWith('/lot')) title = "Lots";
  else if (pathname.startsWith('/component')) title = "Components";
  else if (pathname.startsWith('/models')) title = "ML Models";
  else if (pathname.startsWith('/risk')) title = "Risk Engine";
  else if (pathname.startsWith('/reports')) title = "Reports";
  else if (pathname.startsWith('/settings')) title = "Settings";

  return (
    <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
      {title}
    </span>
  );
}
