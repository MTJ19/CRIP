"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ModelsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/upload');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-mono text-sm">
      Redirecting to Workspace...
    </div>
  );
}
