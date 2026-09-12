"use client";
import { usePathname } from 'next/navigation';

export default function TopBarTitle() {
  const pathname = usePathname();
  
  let title = "Overview";
  if (pathname === '/upload' || pathname.startsWith('/models')) title = "Workspace";
  else if (pathname.startsWith('/history')) title = "Analysis History";
  else if (pathname.startsWith('/lot')) title = "Lots";
  else if (pathname.startsWith('/component')) title = "Components";
  else if (pathname.startsWith('/alerts')) title = "Priority Alerts";
  else if (pathname.startsWith('/reports')) title = "Reports";
  else if (pathname.startsWith('/settings')) title = "Settings";

  return (
    <span className="text-xl font-bold text-white tracking-tight">
      {title}
    </span>
  );
}
