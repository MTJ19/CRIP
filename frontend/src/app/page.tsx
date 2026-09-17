'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  ChevronRight, 
  Activity, 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  HelpCircle, 
  ArrowUpRight, 
  BarChart3, 
  ShieldCheck, 
  Plus, 
  Menu, 
  X, 
  Layers, 
  Cpu, 
  TrendingUp, 
  Sliders, 
  Zap, 
  FileSpreadsheet
} from 'lucide-react';
import { RoboticArmIcon } from '../components/RoboticArmIcon';

/**
 * FadeInUp scroll-reveal component
 * Slides elements up from translate-y-10 and opacity-0 to opacity-100 over 1000ms
 */
function FadeInUp({ 
  children, 
  delay = 0, 
  className = "" 
}: { 
  children: React.ReactNode; 
  delay?: number; 
  className?: string; 
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-1000 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      } ${className}`}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [activeChannel, setActiveChannel] = useState<'rds' | 'vth' | 'idss'>('rds');

  const channelData = {
    rds: {
      name: 'RDS(on) Drift',
      paramLabel: 'RDS(on) ON-STATE CONDUCTION RESISTANCE',
      unit: 'mΩ',
      specText: 'MAX SPEC LIMIT: 44.0 mΩ',
      isMaxSpec: true,
      baseline: '28.4 mΩ',
      at72h: '41.2 mΩ',
      driftPct: '+45.1%',
      lotMean: '29.1 mΩ (σ = 3.2)',
      zScore: '+3.78σ',
      forecast168h: '53.8 mΩ',
      status: 'GATE OXIDE DEGRADATION',
      specY: 85,
      specZone: { y: 20, height: 65 },
      corridorTop: 185,
      corridorBottom: 225,
      normalPaths: [
        "M 60 205 C 180 207, 300 204, 430 206 C 560 208, 690 205, 820 207",
        "M 60 200 C 180 203, 300 198, 430 202 C 560 205, 690 202, 820 204",
        "M 60 212 C 180 210, 300 214, 430 211 C 560 213, 690 210, 820 212",
        "M 60 195 C 180 197, 300 193, 430 196 C 560 198, 690 195, 820 197"
      ],
      observedPath: "M 60 205 C 140 201, 180 190, 240 182 C 300 174, 370 152, 430 132",
      points: [
        { x: 60, y: 205, val: '28.4 mΩ', h: '0h' },
        { x: 240, y: 182, val: '31.8 mΩ', h: '24h' },
        { x: 430, y: 132, val: '41.2 mΩ', h: '72h' }
      ],
      forecastPath: "M 430 132 C 520 102, 600 85, 680 72 C 730 63, 780 52, 820 44",
      specBreachPoint: { x: 600, y: 85, text: 'Spec Breach @ 106h' },
      forecastEnd: { x: 820, y: 44, val: '53.8 mΩ' },
      coneArea: "M 430 132 L 820 25 L 820 70 Z",
      callout72h: { x: 300, y: 64, title: '72h LATENT DRIFT (+3.78σ)', sub: '41.2 mΩ · Approaching Spec' },
      callout168h: { x: 630, y: 16, title: '168h BREAKDOWN FORECAST', sub: '53.8 mΩ · Spec Exceeded' }
    },
    vth: {
      name: 'VGS(th) Shift',
      paramLabel: 'VGS(th) GATE THRESHOLD VOLTAGE',
      unit: 'V',
      specText: 'MIN SPEC LIMIT: 2.00 V',
      isMaxSpec: false,
      baseline: '3.42 V',
      at72h: '2.48 V',
      driftPct: '-27.5%',
      lotMean: '3.38 V (σ = 0.22)',
      zScore: '-4.09σ',
      forecast168h: '1.68 V',
      status: 'HOT-CARRIER TRAPPING',
      specY: 215,
      specZone: { y: 215, height: 55 },
      corridorTop: 85,
      corridorBottom: 110,
      normalPaths: [
        "M 60 95 C 180 97, 300 96, 430 98 C 560 99, 690 97, 820 99",
        "M 60 90 C 180 92, 300 91, 430 93 C 560 94, 690 92, 820 94",
        "M 60 102 C 180 100, 300 104, 430 102 C 560 103, 690 101, 820 103"
      ],
      observedPath: "M 60 95 C 140 102, 180 115, 240 128 C 300 142, 370 162, 430 178",
      points: [
        { x: 60, y: 95, val: '3.42 V', h: '0h' },
        { x: 240, y: 128, val: '3.10 V', h: '24h' },
        { x: 430, y: 178, val: '2.48 V', h: '72h' }
      ],
      forecastPath: "M 430 178 C 520 198, 620 215, 710 232 C 760 242, 790 248, 820 256",
      specBreachPoint: { x: 620, y: 215, text: 'Spec Breach @ 124h' },
      forecastEnd: { x: 820, y: 256, val: '1.68 V' },
      coneArea: "M 430 178 L 820 275 L 820 235 Z",
      callout72h: { x: 300, y: 110, title: '72h THRESHOLD DROP (-4.09σ)', sub: '2.48 V · Oxide Trap Degradation' },
      callout168h: { x: 630, y: 215, title: '168h MIN SPEC BREACH', sub: '1.68 V · Inadvertent Conduction' }
    },
    idss: {
      name: 'IDSS Leakage',
      paramLabel: 'IDSS DRAIN-SOURCE REVERSE LEAKAGE',
      unit: 'µA',
      specText: 'MAX SPEC LIMIT: 250 µA',
      isMaxSpec: true,
      baseline: '12.0 µA',
      at72h: '98.5 µA',
      driftPct: '+720%',
      lotMean: '15.2 µA (σ = 4.8)',
      zScore: '+4.25σ',
      forecast168h: '360 µA',
      status: 'JUNCTION THERMAL RUNAWAY',
      specY: 85,
      specZone: { y: 20, height: 65 },
      corridorTop: 220,
      corridorBottom: 240,
      normalPaths: [
        "M 60 230 C 180 228, 300 227, 430 225 C 560 224, 690 222, 820 220",
        "M 60 235 C 180 233, 300 232, 430 230 C 560 229, 690 227, 820 225",
        "M 60 225 C 180 223, 300 222, 430 220 C 560 219, 690 217, 820 215"
      ],
      observedPath: "M 60 230 C 140 228, 180 224, 240 216 C 300 205, 370 178, 430 152",
      points: [
        { x: 60, y: 230, val: '12 µA', h: '0h' },
        { x: 240, y: 216, val: '24 µA', h: '24h' },
        { x: 430, y: 152, val: '98.5 µA', h: '72h' }
      ],
      forecastPath: "M 430 152 C 520 120, 640 85, 720 62 C 760 50, 790 42, 820 32",
      specBreachPoint: { x: 640, y: 85, text: 'Spec Breach @ 138h' },
      forecastEnd: { x: 820, y: 32, val: '360 µA' },
      coneArea: "M 430 152 L 820 15 L 820 60 Z",
      callout72h: { x: 300, y: 85, title: '72h THERMAL EXPONENT (+4.25σ)', sub: '98.5 µA · Rapid Degradation' },
      callout168h: { x: 630, y: 12, title: '168h SHORT-CIRCUIT RISK', sub: '360 µA · Thermal Breakdown' }
    }
  };

  const curr = channelData[activeChannel];

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const standards = [
    { name: "ISRO PS-26170", desc: "Aerospace Burn-In Standard" },
    { name: "MIL-STD-883", desc: "Method 1015 Reliability" },
    { name: "JEDEC JESD22-A108", desc: "High Temperature Reverse Bias" },
    { name: "AEC-Q101 Qualified", desc: "Automotive Discrete Screening" },
    { name: "Infineon IRF540N", desc: "Power MOSFET Spec Standard" },
    { name: "ESA ECSS-Q-ST-60C", desc: "Space-Grade Electrical Components" }
  ];

  const faqs = [
    {
      q: "How does CRIP detect latent defects before absolute threshold failure?",
      a: "Traditional qualification uses static datasheet bounds (e.g., RDS(on) ≤ 44 mΩ). A part measuring 41 mΩ technically passes, even if the entire manufacturing lot clusters at 28 ± 2 mΩ (a 6.5σ divergence). CRIP computes dynamic lot-relative z-scores and runs an unsupervised Isolation Forest tuned to ≤ 1% false-positive rate, isolating latent defect outliers while they are still within absolute specs."
    },
    {
      q: "Which component standards and electrical parameters are evaluated?",
      a: "The core engine evaluates high-reliability N-channel power MOSFETs modeled on Infineon IRF540N standards (VDS ≤ 100V, VGS(th) ∈ [2.0V, 4.0V], RDS(on) ≤ 44 mΩ, IDSS ≤ 250 µA). It ingests multi-checkpoint burn-in series, computing delta dynamics (ΔVGS(th), ΔRDS(on), ΔIDSS) and degradation velocity slopes."
    },
    {
      q: "What happens if an ingested dataset contains duplicate or conflicting test hours?",
      a: "CRIP enforces strict reliability integrity. In the underlying database, records have a unique constraint on (component_id, test_hour). When new datasets are uploaded, existing measurement checkpoints are never silently overwritten; duplicate records are safely skipped, and the exact count and identifiers are logged in the conflict audit summary."
    },
    {
      q: "Can the platform operate fully offline without external cloud dependencies?",
      a: "Yes. The backend REST service automatically detects whether a cloud Supabase PostgreSQL connection is configured. If DATABASE_URL is unset, it seamlessly provisions and operates on a local persistent SQLite database (backend/burnin_storage.db) with identical relational schema."
    },
    {
      q: "How does early drift forecasting work at the 72-hour screening checkpoint?",
      a: "Using baseline measurements (0h) and intermediate 72h screening checkpoints, CRIP extracts degradation trajectories and inputs them into a HistGradientBoosting classifier. This forecasts whether a component will cross critical failure boundaries at the 120h or 168h full burn-in milestones, enabling early screening holds."
    }
  ];

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden w-full flex-1">
      
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-20 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/5 blur-[140px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-purple-500/5 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full"></div>
      </div>

      {/* 1. STICKY & RESPONSIVE NAVIGATION BAR */}
      <header 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-black/85 backdrop-blur-md border-b border-white/10 py-3.5 shadow-2xl' 
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          {/* Logo on Left */}
          <Link href="#home" className="flex items-center space-x-3 group cursor-pointer">
            <RoboticArmIcon className="w-10 h-10 transition-transform duration-300 group-hover:scale-105" />
            <div className="flex flex-col">
              <span className="font-bold text-white tracking-widest text-lg leading-tight">CRIP</span>
              <span className="text-[9px] font-mono text-slate-400 tracking-wider hidden sm:block">COMPONENT SCREENING PLATFORM</span>
            </div>
          </Link>

          {/* Links in Center (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-white/5 border border-white/10 rounded-full px-3 py-1.5 backdrop-blur-md">
            <a href="#home" className="px-4 py-1.5 text-xs font-medium text-slate-300 hover:text-white hover:bg-white/10 rounded-full transition-colors">Home</a>
            <a href="#how-it-works" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">How It Works</a>
            <a href="#why-crip" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">Why CRIP</a>
            <a href="#drift" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">Drift Forecast</a>
            <a href="#explain" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">Explainability</a>
            <a href="#faq" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">FAQ</a>
            <a href="#about" className="px-4 py-1.5 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">About</a>
          </nav>

          {/* Action Button on Right */}
          <div className="hidden md:flex items-center space-x-3">
            <Link 
              href="/dashboard" 
              className="bg-[#1F1F22] hover:bg-[#2A2A2D] text-white text-sm font-medium px-5 py-2.5 rounded-full border border-white/10 active:scale-95 transition-all flex items-center group shadow-sm"
            >
              Get started <ArrowUpRight className="w-4 h-4 ml-1.5 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-black/95 border-b border-white/10 px-6 py-6 backdrop-blur-2xl animate-in slide-in-from-top-4 duration-300">
            <div className="flex flex-col space-y-4">
              <a 
                href="#home" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
              >
                Home
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                How It Works
              </a>
              <a 
                href="#why-crip" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Why CRIP
              </a>
              <a 
                href="#drift" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Drift Forecast
              </a>
              <a 
                href="#explain" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                Explainability
              </a>
              <a 
                href="#faq" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                FAQ
              </a>
              <a 
                href="#about" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-slate-400 hover:text-white transition-colors"
              >
                About
              </a>
              <div className="pt-2 border-t border-white/10">
                <Link 
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center bg-white text-black font-medium py-3 rounded-full block transition-colors shadow-lg"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* 2. HERO SECTION */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 relative z-0">
        
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-70 pointer-events-none"
        >
          <source src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4" type="video/mp4" />
        </video>
        
        {/* Video Dark Overlay Gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0A0A0C] -z-10 pointer-events-none"></div>

        {/* Vertical Light Stream Effects */}
        <div className="absolute bottom-[10%] left-1/2 -translate-x-1/2 flex space-x-20 opacity-25 pointer-events-none -z-10">
          <div className="w-px h-48 bg-gradient-to-t from-transparent via-white to-transparent"></div>
          <div className="w-px h-72 bg-gradient-to-t from-transparent via-white to-transparent -translate-y-12"></div>
          <div className="w-px h-40 bg-gradient-to-t from-transparent via-white to-transparent translate-y-8"></div>
        </div>

        <div className="z-10 text-center max-w-4xl mx-auto px-6 relative mt-4">
          <FadeInUp delay={100}>
            <div className="inline-flex items-center space-x-2.5 bg-white/5 border border-white/10 text-slate-300 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-medium tracking-wide">✨ Real-Time Burn-In & Parametric Drift Intelligence</span>
            </div>
          </FadeInUp>
          
          <FadeInUp delay={200}>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
              Detect Earlier.<br/>
              Predict Smarter.<br/>
              <span className="font-serif italic font-normal text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Explain Every Decision.
              </span>
            </h1>
          </FadeInUp>
          
          <FadeInUp delay={300}>
            <p className="text-[16px] text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
              Our platform integrates statistical lot z-scoring and ML ensembles to deliver real-time understanding of burn-in screening, identifying latent defects at 72h before complete 168h breakdown.
            </p>
          </FadeInUp>
          
          <FadeInUp delay={400}>
            <div className="flex flex-row items-center justify-center space-x-4 mb-14">
              <Link 
                href="/dashboard" 
                className="px-8 py-3.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(255,255,255,0.15)] flex items-center"
              >
                Get started <ArrowUpRight className="w-4 h-4 ml-2" />
              </Link>
              <a 
                href="#how-it-works" 
                className="px-8 py-3.5 rounded-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white font-medium border border-white/10 active:scale-95 transition-all duration-200"
              >
                See How It Works
              </a>
            </div>
          </FadeInUp>
        </div>

        {/* Semiconductor Screening & Drift Telemetry Console */}
        <FadeInUp delay={500} className="w-full max-w-5xl mx-auto px-4 sm:px-6 z-10">
          <div className="relative w-full border border-white/10 bg-[#090b10]/95 backdrop-blur-2xl rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
            
            {/* Top Engineering Control Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-xs font-mono font-semibold tracking-wider text-slate-200">
                    BURN-IN DRIFT TELEMETRY
                  </span>
                </div>
                <div className="hidden sm:flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">DUT: IRF540N (100V N-MOS)</span>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10">LOT #L08-4X9B (N=500)</span>
                </div>
              </div>

              {/* Parametric Channel Selectors */}
              <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/10">
                {(['rds', 'vth', 'idss'] as const).map((ch) => {
                  const isActive = activeChannel === ch;
                  return (
                    <button
                      key={ch}
                      onClick={() => setActiveChannel(ch)}
                      className={`px-3 py-1 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 ${
                        isActive
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 shadow-sm font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <span>{channelData[ch].name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Oscilloscope Visual Display */}
            <div className="relative p-3 sm:p-5 bg-gradient-to-b from-[#090b10] to-[#0d1017]">
              
              {/* Channel Label Banner */}
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2 px-2">
                <div className="flex items-center space-x-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-white font-medium">{curr.paramLabel}</span>
                  <span className="text-slate-500">({curr.unit})</span>
                </div>
                <div className="flex items-center space-x-4 text-[11px]">
                  <span className="text-rose-400 font-semibold">{curr.specText}</span>
                  <span className="hidden md:inline text-slate-400">Lot Baseline: <span className="text-white">{curr.lotMean}</span></span>
                </div>
              </div>

              {/* Precision Vector SVG Chart with Fixed Aspect Ratio */}
              <div className="w-full relative aspect-[880/280] select-none">
                <svg
                  viewBox="0 0 880 280"
                  className="w-full h-full block"
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    {/* Grid Pattern */}
                    <pattern id="telemGrid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
                    </pattern>

                    {/* Danger Zone Gradient */}
                    <linearGradient id="dangerZoneGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity="0.16" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.02" />
                    </linearGradient>

                    {/* Uncertainty Cone Gradient */}
                    <linearGradient id="coneGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.18" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0.04" />
                    </linearGradient>
                  </defs>

                  {/* Background Grid */}
                  <rect x="40" y="20" width="800" height="230" fill="url(#telemGrid)" />

                  {/* Danger Zone Shading beyond Spec Limit */}
                  <rect
                    x="40"
                    y={curr.specZone.y}
                    width="800"
                    height={curr.specZone.height}
                    fill="url(#dangerZoneGrad)"
                  />

                  {/* Horizontal Spec Limit Line */}
                  <line
                    x1="40"
                    y1={curr.specY}
                    x2="840"
                    y2={curr.specY}
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="6 4"
                    strokeOpacity="0.75"
                  />
                  <text
                    x="830"
                    y={curr.isMaxSpec ? curr.specY - 8 : curr.specY + 14}
                    textAnchor="end"
                    fill="#ef4444"
                    fontSize="10"
                    fontFamily="monospace"
                    fontWeight="600"
                    opacity="0.9"
                  >
                    {curr.specText}
                  </text>

                  {/* ±2σ Normal Lot Population Corridor */}
                  <rect
                    x="50"
                    y={curr.corridorTop}
                    width="780"
                    height={curr.corridorBottom - curr.corridorTop}
                    fill="#3b82f6"
                    fillOpacity="0.06"
                    stroke="#3b82f6"
                    strokeOpacity="0.15"
                    strokeWidth="1"
                    rx="4"
                  />
                  <text
                    x="65"
                    y={curr.corridorTop + 14}
                    fill="#60a5fa"
                    fontSize="9.5"
                    fontFamily="monospace"
                    opacity="0.65"
                  >
                    ±2σ Nominal Lot Corridor (499 Healthy Units)
                  </text>

                  {/* Normal Lot Healthy Traces */}
                  {curr.normalPaths.map((pathStr, i) => (
                    <path
                      key={i}
                      d={pathStr}
                      fill="none"
                      stroke="#94a3b8"
                      strokeOpacity="0.25"
                      strokeWidth="1.2"
                    />
                  ))}

                  {/* Checkpoint Vertical Milestone Lines */}
                  <line x1="60" y1="20" x2="60" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="240" y1="20" x2="240" y2="250" stroke="rgba(255,255,255,0.15)" strokeWidth="1" strokeDasharray="3 3" />
                  <line x1="430" y1="20" x2="430" y2="250" stroke="#10b981" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.8" />
                  <line x1="820" y1="20" x2="820" y2="250" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="4 3" strokeOpacity="0.8" />

                  {/* Forecast Uncertainty Envelope (Cone) */}
                  <path d={curr.coneArea} fill="url(#coneGrad)" />

                  {/* Forecast Extrapolation Curve (72h -> 168h) */}
                  <path
                    d={curr.forecastPath}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                  />

                  {/* Observed Anomalous Trajectory (0h -> 24h -> 72h) */}
                  <path
                    d={curr.observedPath}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />

                  {/* Data Points on Observed Curve */}
                  {curr.points.map((pt, idx) => (
                    <g key={idx}>
                      <circle cx={pt.x} cy={pt.y} r="5" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                      <text
                        x={pt.x}
                        y={pt.y + (pt.h === '72h' ? 20 : -12)}
                        textAnchor="middle"
                        fill="#fca5a5"
                        fontSize="10"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {pt.val}
                      </text>
                    </g>
                  ))}

                  {/* 72h Radar Pulse Marker */}
                  <circle cx="430" cy={curr.points[2].y} r="12" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" className="animate-ping" />
                  <circle cx="430" cy={curr.points[2].y} r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />

                  {/* 72h Anomaly Callout Box */}
                  <g transform={`translate(${curr.callout72h.x}, ${curr.callout72h.y})`}>
                    <line
                      x1={190}
                      y1={20}
                      x2={430 - curr.callout72h.x}
                      y2={curr.points[2].y - curr.callout72h.y}
                      stroke="#ef4444"
                      strokeWidth="1"
                      strokeOpacity="0.75"
                    />
                    <rect x="0" y="0" width="190" height="42" rx="6" fill="#180c10" stroke="#ef4444" strokeWidth="1.2" strokeOpacity="0.9" />
                    <circle cx="12" cy="14" r="3.5" fill="#ef4444" />
                    <text x="22" y="16" fill="#fca5a5" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                      {curr.callout72h.title}
                    </text>
                    <text x="22" y="32" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                      {curr.callout72h.sub}
                    </text>
                  </g>

                  {/* Spec Breach Point Marker */}
                  <g>
                    <circle cx={curr.specBreachPoint.x} cy={curr.specBreachPoint.y} r="4" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    <text
                      x={curr.specBreachPoint.x}
                      y={curr.isMaxSpec ? curr.specBreachPoint.y + 16 : curr.specBreachPoint.y - 10}
                      textAnchor="middle"
                      fill="#fbbf24"
                      fontSize="9.5"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      ▲ {curr.specBreachPoint.text}
                    </text>
                  </g>

                  {/* 168h Final Projected Point */}
                  <g>
                    <circle cx={curr.forecastEnd.x} cy={curr.forecastEnd.y} r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
                    {/* 168h Callout Box */}
                    <g transform={`translate(${curr.callout168h.x}, ${curr.callout168h.y})`}>
                      <line
                        x1={0}
                        y1={20}
                        x2={curr.forecastEnd.x - curr.callout168h.x}
                        y2={curr.forecastEnd.y - curr.callout168h.y}
                        stroke="#f59e0b"
                        strokeWidth="1"
                        strokeOpacity="0.75"
                      />
                      <rect x="0" y="0" width="180" height="42" rx="6" fill="#181308" stroke="#f59e0b" strokeWidth="1.2" strokeOpacity="0.9" />
                      <circle cx="12" cy="14" r="3.5" fill="#f59e0b" />
                      <text x="22" y="16" fill="#fde68a" fontSize="9.5" fontFamily="monospace" fontWeight="bold">
                        {curr.callout168h.title}
                      </text>
                      <text x="22" y="32" fill="#cbd5e1" fontSize="9" fontFamily="monospace">
                        {curr.callout168h.sub}
                      </text>
                    </g>
                  </g>

                  {/* Bottom Horizontal Axis */}
                  <line x1="40" y1="250" x2="840" y2="250" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

                  {/* Time Milestone Axis Labels */}
                  <g>
                    <text x="60" y="272" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="monospace" fontWeight="500">
                      0h (Baseline)
                    </text>
                    <text x="240" y="272" textAnchor="middle" fill="#94a3b8" fontSize="10.5" fontFamily="monospace" fontWeight="500">
                      24h (Thermal)
                    </text>
                    <text x="430" y="272" textAnchor="middle" fill="#34d399" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                      72h (Screening Gate)
                    </text>
                    <text x="820" y="272" textAnchor="middle" fill="#fbbf24" fontSize="10.5" fontFamily="monospace" fontWeight="bold">
                      168h (Full Burn-In)
                    </text>
                  </g>
                </svg>
              </div>

              {/* Bottom Telemetry HUD Matrix Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-3 pt-3 border-t border-white/10 font-mono">
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">0h Baseline</div>
                  <div className="text-sm font-bold text-white mt-0.5">{curr.baseline}</div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">Lot Mean: {curr.lotMean.split(' ')[0]}</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">72h Observed</div>
                  <div className="text-sm font-bold text-rose-400 mt-0.5">{curr.at72h}</div>
                  <div className="text-[10px] text-rose-300 mt-0.5">Shift: {curr.driftPct}</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Lot Z-Score</div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">{curr.zScore}</div>
                  <div className="text-[10px] text-amber-300/80 truncate mt-0.5">{curr.status}</div>
                </div>
                <div className="bg-black/40 border border-white/5 p-2.5 rounded-xl">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">168h Decision</div>
                  <div className="text-sm font-bold text-indigo-300 mt-0.5">QUARANTINE @ 72h</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Saves 96h Chamber Time</div>
                </div>
              </div>

            </div>
          </div>
        </FadeInUp>

        {/* Infinite Marquee: Standards & Protocols */}
        <div className="w-full max-w-7xl mx-auto px-6 mt-20">
          <FadeInUp delay={600}>
            <p className="text-xs uppercase tracking-widest text-slate-500 font-mono text-center mb-6">
              Compliant with High-Reliability Aerospace & Defense Protocols
            </p>
            <div 
              className="relative w-full overflow-hidden py-4"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)',
                WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)'
              }}
            >
              <div className="animate-marquee flex items-center">
                {[...standards, ...standards, ...standards, ...standards].map((std, idx) => (
                  <div 
                    key={idx} 
                    className="flex-shrink-0 px-6 py-2.5 mx-2 bg-white/5 border border-white/10 rounded-xl flex items-center space-x-3 backdrop-blur-sm hover:border-white/20 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-white font-mono">{std.name}</div>
                      <div className="text-[10px] text-slate-400">{std.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FadeInUp>
        </div>

      </section>

      {/* 3. WORKFLOW SECTION */}
      <section id="how-it-works" className="py-28 border-t border-white/5 bg-[#0a0b0e]">
        <div className="max-w-7xl mx-auto px-6">
          <FadeInUp>
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">From Raw Measurements to QA Action</h2>
              <p className="text-slate-400 text-sm md:text-base leading-relaxed">
                Seven automated verification stages transform high-stress screening logs into actionable component screening decisions.
              </p>
            </div>
          </FadeInUp>
          
          <FadeInUp delay={200}>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <WorkflowStep num="01" title="UPLOAD" desc="Ingest CSV burn-in logs" icon={<Database className="w-5 h-5"/>} />
              <WorkflowStep num="02" title="VALIDATE" desc="Check schema & physics bounds" icon={<CheckCircle2 className="w-5 h-5"/>} />
              <WorkflowStep num="03" title="ANALYZE" desc="Lot stats & z-score engine" icon={<BarChart3 className="w-5 h-5"/>} />
              <WorkflowStep num="04" title="DETECT" desc="Isolation Forest outlier scoring" icon={<Activity className="w-5 h-5"/>} />
              <WorkflowStep num="05" title="PREDICT" desc="Gradient boost drift horizon" icon={<TrendingUp className="w-5 h-5"/>} />
              <WorkflowStep num="06" title="EXPLAIN" desc="Decompose physical failure modes" icon={<HelpCircle className="w-5 h-5"/>} />
              <WorkflowStep num="07" title="ACT" desc="Flag screening hold / pass" icon={<ShieldCheck className="w-5 h-5"/>} last />
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 4. FEATURE 1: WHY THRESHOLDS FAIL (id="why-crip") */}
      <section id="why-crip" className="py-28 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Text */}
            <FadeInUp>
              <div>
                <div className="inline-flex items-center space-x-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-full px-3.5 py-1 text-xs font-medium mb-6">
                  <span>✨ Statistical Lot Dispersion</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                  Where Static Datasheet Limits Fall Short.
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Traditional qualification checks whether measurements remain inside broad datasheet boundaries (<code className="text-slate-200">PASS if value ≤ Max</code>). This causes latent manufacturing defects to slip through when a component stays below absolute limits but deviates anomalously from its wafer lot baseline.
                </p>
                <Link 
                  href="/dashboard" 
                  className="inline-flex items-center px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-all shadow-md active:scale-95 text-sm"
                >
                  Explore Screening Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </FadeInUp>

            {/* Right Mockup with Background Video */}
            <FadeInUp delay={200}>
              <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative shadow-2xl min-h-[420px] flex items-center justify-center">
                {/* Background Video */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 object-cover w-full h-full opacity-35"
                >
                  <source src="https://cdn.sceneai.art/Hero%20Section%20Video/1bcc8fa3-37f6-4c53-8591-0347e4c7f8ac.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60"></div>

                {/* Floating Comparison Cards */}
                <div className="relative z-10 w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Traditional Screening Card */}
                  <div className="bg-[#1C1C1E]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase mb-3">Traditional Screening</div>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Reading:</span> <span className="text-white font-bold">410 µA</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Datasheet Limit:</span> <span className="text-slate-300">500 µA</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-3 border-t border-white/10 flex items-center space-x-2 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-bold text-xs">PASS (False Safety)</span>
                    </div>
                  </div>

                  {/* CRIP Intelligence Card */}
                  <div className="bg-[#1C1C1E]/95 backdrop-blur-xl border border-red-500/30 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="text-[10px] font-mono tracking-widest text-red-400 uppercase mb-3">CRIP Intelligence</div>
                      <div className="space-y-2 font-mono text-xs">
                        <div className="flex justify-between text-slate-400">
                          <span>Lot Mean:</span> <span className="text-white">260 µA</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Lot Std Dev:</span> <span className="text-white">40 µA</span>
                        </div>
                        <div className="flex justify-between text-slate-400 bg-red-500/10 px-1.5 py-0.5 rounded">
                          <span>Lot Z-Score:</span> <strong className="text-red-400 font-bold">+3.75σ</strong>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 pt-3 border-t border-red-500/20 flex items-center space-x-2 text-red-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="font-bold text-xs">CRITICAL ANOMALY</span>
                    </div>
                  </div>
                </div>
              </div>
            </FadeInUp>

          </div>
        </div>
      </section>

      {/* 5. FEATURE 2: 168-HOUR HORIZON FORECASTING (id="drift") */}
      <section id="drift" className="py-28 bg-[#0a0b0e] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Mockup with Background Video */}
            <FadeInUp>
              <div className="rounded-3xl overflow-hidden p-8 border border-white/10 relative shadow-2xl min-h-[420px] flex items-center justify-center">
                {/* Background Video */}
                <video 
                  autoPlay 
                  loop 
                  muted 
                  playsInline 
                  className="absolute inset-0 object-cover w-full h-full opacity-35"
                >
                  <source src="https://cdn.sceneai.art/Hero%20Section%20Video/736fd4a0-70ac-4f44-9633-55769ead6aca.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60"></div>

                {/* Floating Trajectory Card */}
                <div className="relative z-10 w-full max-w-md bg-[#1C1C1E]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xs font-mono font-bold text-white flex items-center">
                      <Sliders className="w-3.5 h-3.5 mr-2 text-amber-400" />
                      RDS(on) Drift Horizon
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                      Checkpoint: 72h
                    </span>
                  </div>

                  <div className="h-44 w-full relative border-l border-b border-white/20 my-2">
                    {/* Trajectory lines */}
                    <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Datasheet Max limit line */}
                      <line x1="0" y1="20" x2="100" y2="20" stroke="#ef4444" strokeDasharray="3 3" strokeWidth="1" />
                      {/* Lot Baseline */}
                      <path d="M 0 75 L 40 73 L 70 70 L 100 68" stroke="#64748b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
                      {/* Observed */}
                      <path d="M 0 70 L 40 60 L 70 42" stroke="#6366f1" strokeWidth="2.5" fill="none" />
                      {/* Forecasted */}
                      <path d="M 70 42 L 100 15" stroke="#f59e0b" strokeWidth="2.5" strokeDasharray="3 3" fill="none" />
                      <circle cx="70" cy="42" r="3" fill="#6366f1" />
                      <circle cx="100" cy="15" r="4" fill="#f59e0b" className="animate-pulse" />
                    </svg>

                    <div className="absolute top-2 right-2 text-[9px] font-mono text-red-400">Spec Max: 44 mΩ</div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-2 border-t border-white/10">
                    <span className="flex items-center"><span className="w-2 h-0.5 bg-indigo-500 mr-1"></span> 0h - 72h Observed</span>
                    <span className="flex items-center text-amber-400 font-bold"><span className="w-2 h-0.5 bg-amber-500 mr-1"></span> 168h Forecast</span>
                  </div>
                </div>
              </div>
            </FadeInUp>

            {/* Right Text */}
            <FadeInUp delay={200}>
              <div>
                <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full px-3.5 py-1 text-xs font-medium mb-6">
                  <span>✨ 168-Hour Horizon Forecast</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                  Forecast Degradation Before Full Breakdown.
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Screening at the 72-hour mark provides the crucial window of opportunity. CRIP uses HistGradientBoosting models to project degradation velocity outward to 120h and 168h burn-in limits, giving qualification engineers predictive foresight to abort high-risk parts early.
                </p>
                <Link 
                  href="/component" 
                  className="inline-flex items-center px-6 py-3 rounded-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white font-medium border border-white/10 transition-all shadow-md active:scale-95 text-sm"
                >
                  View Component Trajectories <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </FadeInUp>

          </div>
        </div>
      </section>

      {/* 6. FEATURE 3: EXPLAINABILITY & TRANSPARENCY (id="explain") */}
      <section id="explain" className="py-28 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            
            {/* Left Text */}
            <FadeInUp>
              <div>
                <div className="inline-flex items-center space-x-2 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full px-3.5 py-1 text-xs font-medium mb-6">
                  <span>✨ Explainable QA Intelligence</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight leading-tight">
                  Don&apos;t Just Flag It. Explain Every Decision.
                </h2>
                <p className="text-gray-400 text-base leading-relaxed mb-8">
                  Black-box predictions are unacceptable in mission-critical aerospace screening. CRIP breaks down the anomaly score into individual contributing electrical mechanisms—leakage drift, threshold voltage divergence, and thermal slope acceleration.
                </p>
                <Link 
                  href="/alerts" 
                  className="inline-flex items-center px-6 py-3 rounded-full bg-white text-black font-medium hover:bg-slate-200 transition-all shadow-md active:scale-95 text-sm"
                >
                  Inspect Active Alerts <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </FadeInUp>

            {/* Right Mockup: Investigation Panel */}
            <FadeInUp delay={200}>
              <div className="bg-[#1C1C1E]/90 border border-white/10 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-xl">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10 flex justify-between items-center">
                  <span className="font-mono text-white font-bold flex items-center">
                    <Cpu className="w-4 h-4 mr-2 text-indigo-400" />
                    CMP-0427 (IRF540N)
                  </span>
                  <span className="text-xs font-bold px-2.5 py-1 bg-red-500/15 text-red-400 border border-red-500/30 rounded font-mono">
                    HIGH RISK
                  </span>
                </div>
                <div className="p-6">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 font-mono">
                    Contributing Anomaly Mechanisms
                  </h4>
                  <div className="space-y-4">
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-[11px] text-slate-500 font-mono">01</div>
                        <div className="text-sm text-white font-medium">Lot-relative Z-Score (RDS)</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500 w-[90%]"></div>
                        </div>
                        <span className="text-xs text-red-400 font-mono font-medium">90%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-[11px] text-slate-500 font-mono">02</div>
                        <div className="text-sm text-white font-medium">Drift Velocity Acceleration</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 w-[75%]"></div>
                        </div>
                        <span className="text-xs text-amber-400 font-mono font-medium">75%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-[11px] text-slate-500 font-mono">03</div>
                        <div className="text-sm text-slate-300 font-medium">168h Projected Limit Crossing</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-yellow-500 w-[50%]"></div>
                        </div>
                        <span className="text-xs text-yellow-400 font-mono font-medium">50%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-[11px] text-slate-500 font-mono">04</div>
                        <div className="text-sm text-slate-400 font-medium">Thermal Chamber Stress (125°C)</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-slate-500 w-[15%]"></div>
                        </div>
                        <span className="text-xs text-slate-400 font-mono font-medium">15%</span>
                      </div>
                    </div>

                  </div>
                </div>
              </div>
            </FadeInUp>

          </div>
        </div>
      </section>

      {/* 7. FAQ SECTION (id="faq") */}
      <section id="faq" className="py-32 px-6 max-w-3xl mx-auto">
        <FadeInUp>
          <h2 className="text-4xl md:text-5xl font-semibold text-white text-center mb-12 tracking-tight">
            We&apos;ve got answers
          </h2>
        </FadeInUp>

        <FadeInUp delay={200}>
          <div className="border border-white/10 rounded-xl bg-transparent overflow-hidden">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              const isLast = index === faqs.length - 1;

              return (
                <div 
                  key={index}
                  className={`${!isLast ? 'border-b border-white/10' : ''}`}
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full py-6 px-6 flex items-center justify-between text-left focus:outline-none group transition-colors"
                  >
                    <span className="text-base text-white font-medium pr-4">
                      {faq.q}
                    </span>
                    <span className="shrink-0">
                      <Plus 
                        className={`w-5 h-5 text-gray-400 transition-transform duration-300 ease-out group-hover:text-white ${
                          isOpen ? 'rotate-45 text-white' : ''
                        }`} 
                      />
                    </span>
                  </button>

                  {/* CSS Grid Smooth Height Transition */}
                  <div 
                    className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                      isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-gray-400 text-sm pb-6 px-6 leading-relaxed font-normal">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </FadeInUp>
      </section>

      {/* 8. ABOUT PROTOTYPE CALLOUT (id="about") */}
      <section id="about" className="py-20 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <FadeInUp>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">Built for Reliability-Critical Decisions</h2>
            <p className="text-slate-400 leading-relaxed mb-8 max-w-2xl mx-auto text-sm">
              CRIP is an automated decision-support platform for component burn-in and environmental screening, developed for aerospace and high-reliability electronics screening standards.
            </p>
            
            <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl max-w-2xl mx-auto backdrop-blur-sm shadow-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500 mb-2" />
              <h4 className="text-sm font-bold text-amber-400 mb-1">Prototype • Synthetic Demonstration Data</h4>
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Real-world mission qualification requires calibration against active foundry lots. The demonstrated models feature the calibrated IRF540N power MOSFET suite.
              </p>
            </div>
          </FadeInUp>
        </div>
      </section>

      {/* 9. FOOTER SECTION (id="contact") */}
      <footer id="contact" className="relative z-0 pt-32 pb-10 px-6 border-t border-white/5 overflow-hidden">
        
        {/* Background Video */}
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="absolute inset-0 object-cover w-full h-full opacity-30 -z-10 pointer-events-none"
        >
          <source src="https://cdn.sceneai.art/Hero%20Section%20Video/50b4f304-cdca-4e12-8735-580d225834be.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black -z-10"></div>

        <div className="max-w-7xl mx-auto">
          {/* Top CTA */}
          <FadeInUp>
            <div className="text-center mb-28">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight">
                Ready to ensure{' '}
                <span className="italic font-serif font-normal text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                  zero-defect reliability?
                </span>
              </h2>
              <div className="flex flex-row items-center justify-center space-x-4">
                <Link 
                  href="/dashboard"
                  className="px-8 py-3.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 active:scale-95 transition-all duration-200 shadow-xl"
                >
                  Get started
                </Link>
                <Link 
                  href="/upload"
                  className="px-8 py-3.5 rounded-full bg-[#1F1F22] hover:bg-[#2A2A2D] text-white font-medium border border-white/10 active:scale-95 transition-all duration-200"
                >
                  Upload Dataset
                </Link>
              </div>
            </div>
          </FadeInUp>

          {/* Link Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20">
            {/* Col 1: Logo & Title */}
            <div>
              <Link href="#home" className="flex items-center space-x-2.5 mb-4 group cursor-pointer">
                <RoboticArmIcon className="w-8 h-8" />
                <span className="font-bold text-white text-xl tracking-widest">CRIP</span>
              </Link>
              <p className="text-sm text-gray-400 leading-relaxed max-w-xs">
                Semiconductor burn-in screening, anomaly detection, and failure horizon forecasting for critical electronics.
              </p>
            </div>

            {/* Col 2: Platform */}
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Platform</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Screening Dashboard</Link></li>
                <li><Link href="/upload" className="hover:text-white transition-colors">CSV Data Ingestion</Link></li>
                <li><Link href="/lot" className="hover:text-white transition-colors">Lot Health Overview</Link></li>
                <li><Link href="/component" className="hover:text-white transition-colors">Component Explorer</Link></li>
              </ul>
            </div>

            {/* Col 3: Intelligence Layer */}
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Intelligence</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><span className="hover:text-white cursor-default">72h Early Checkpoint</span></li>
                <li><span className="hover:text-white cursor-default">168h Drift Forecasting</span></li>
                <li><span className="hover:text-white cursor-default">Lot-Relative Z-Scores</span></li>
                <li><span className="hover:text-white cursor-default">Unsupervised Isolation Forest</span></li>
              </ul>
            </div>

            {/* Col 4: Resources & Standards */}
            <div>
              <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider mb-4">Resources</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li><a href="http://127.0.0.1:8000/docs" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">API Documentation</a></li>
                <li><a href="https://www.infineon.com" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">IRF540N Datasheet</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">Workflow Guide</a></li>
                <li><a href="#faq" className="hover:text-white transition-colors">Screening FAQ</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="flex flex-col md:flex-row justify-center items-center gap-3 text-xs text-gray-500 border-t border-white/10 pt-8 text-center">
            <span>© 2026 CRIP. All rights reserved.</span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span>Built for <strong className="text-gray-300 font-medium">ISRO Smart India Hackathon</strong></span>
            <span className="hidden md:inline text-slate-700">•</span>
            <span>Theme & animations powered by <strong className="text-gray-300 font-medium">Tailwind CSS</strong></span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function WorkflowStep({ 
  num, 
  title, 
  desc, 
  icon, 
  last = false 
}: { 
  num: string; 
  title: string; 
  desc: string; 
  icon: React.ReactNode; 
  last?: boolean; 
}) {
  return (
    <div className="flex flex-col items-center text-center relative group">
      <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-4 z-10 group-hover:border-slate-300 group-hover:text-white group-hover:scale-110 transition-all backdrop-blur-sm shadow-md">
        {icon}
      </div>
      <div className="text-[10px] text-slate-500 font-mono mb-1 font-bold">{num}</div>
      <h3 className="text-xs font-bold text-white mb-1 tracking-wide">{title}</h3>
      <p className="text-[11px] text-slate-400 leading-snug">{desc}</p>
      
      {!last && (
        <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-px bg-white/10">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white/30 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
