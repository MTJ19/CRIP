import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import TopBarTitle from "@/components/TopBarTitle";
import { Search, Bell, User } from 'lucide-react';

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "CRIP | Component Reliability Intelligence Platform",
  description: "AI-Driven Anomaly Detection in Component Burn-In & Screening",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${mono.variable} font-sans bg-[#121418] text-slate-300 min-h-screen selection:bg-indigo-500/30`}>
        {children}
      </body>
    </html>
  );
}
