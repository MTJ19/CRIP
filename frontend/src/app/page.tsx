import Link from 'next/link';
import { ArrowRight, ChevronRight, Activity, Database, CheckCircle2, AlertTriangle, HelpCircle, FileSearch, ArrowUpRight, BarChart3, Binary, ShieldCheck, Box } from 'lucide-react';
import { RoboticArmIcon } from '../components/RoboticArmIcon';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden w-full flex-1">
      
      {/* Background Ambient Glows (Inspired by Image 2) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white/5 blur-[120px] rounded-full"></div>
        <div className="absolute top-[20%] right-[-10%] w-[60%] h-[60%] bg-white/5 blur-[150px] rounded-full"></div>
        <div className="absolute bottom-[-20%] left-[20%] w-[40%] h-[40%] bg-white/5 blur-[100px] rounded-full"></div>
      </div>

      {/* Top Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-8 py-6">
        <a href="#home" className="flex items-center space-x-3 group cursor-pointer">
          <RoboticArmIcon className="w-12 h-12" />
          <span className="font-bold text-white tracking-widest text-lg">CRIP</span>
        </a>

        {/* Center Pill Navigation */}
        <div className="hidden md:flex items-center space-x-1 bg-white/5 border border-white/10 rounded-full px-2 py-1 backdrop-blur-md">
          <a href="#home" className="px-5 py-2 text-sm text-white font-medium hover:bg-white/10 rounded-full transition-colors">Home</a>
          <a href="#how-it-works" className="px-5 py-2 text-sm text-slate-400 font-medium hover:bg-white/10 hover:text-white rounded-full transition-colors">How It Works</a>
          <a href="#about" className="px-5 py-2 text-sm text-slate-400 font-medium hover:bg-white/10 hover:text-white rounded-full transition-colors">About</a>
        </div>

        <div>
          <Link href="/dashboard" className="px-6 py-2.5 text-sm font-medium text-white hover:text-slate-300 transition-colors flex items-center group">
            Get Started <ArrowUpRight className="w-4 h-4 ml-2 opacity-70 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative min-h-screen flex flex-col items-center justify-center pt-20 px-6 max-w-7xl mx-auto w-full">
        
        {/* Vertical light streams from Image 2 */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 flex space-x-16 opacity-30 pointer-events-none -z-10">
          <div className="w-px h-40 bg-gradient-to-t from-transparent via-white to-transparent"></div>
          <div className="w-px h-64 bg-gradient-to-t from-transparent via-white to-transparent -translate-y-12"></div>
          <div className="w-px h-32 bg-gradient-to-t from-transparent via-white to-transparent translate-y-8"></div>
        </div>

        <div className="z-10 text-center max-w-4xl mx-auto relative mt-10">
          <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 text-slate-300 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide">AI-Driven Component Reliability Intelligence</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
            Detect Earlier.<br/>
            Predict Smarter.<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">Explain Every Decision.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Component reliability intelligence for burn-in and environmental screening.
          </p>
          
          <div className="flex items-center justify-center space-x-4 mb-16">
            <Link href="/dashboard" className="px-8 py-3.5 rounded-full bg-white/10 border border-white/10 text-white font-medium hover:bg-white/20 active:scale-95 transition-all duration-200 backdrop-blur-md flex items-center shadow-[0_0_20px_rgba(255,255,255,0.05)]">
              Get Started <ArrowUpRight className="w-4 h-4 ml-2 opacity-70" />
            </Link>
            <a href="#how-it-works" className="px-8 py-3.5 rounded-full bg-white text-black font-medium hover:bg-slate-200 active:scale-95 transition-all duration-200 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
              See How It Works
            </a>
          </div>
        </div>

        {/* Technical Hero Visual */}
        <div className="relative w-full max-w-4xl mx-auto h-[320px] md:h-[400px] border border-white/10 bg-[#0a0b0e]/80 backdrop-blur-xl rounded-xl overflow-hidden shadow-2xl z-10">
          
          {/* Engineering Plot Grid */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          
          {/* Axes */}
          <div className="absolute bottom-12 left-12 right-0 h-px bg-white/20"></div>
          <div className="absolute top-0 bottom-12 left-12 w-px bg-white/20"></div>
          <div className="absolute top-4 left-4 text-[10px] text-slate-500 font-mono">ΔV / PARAMETER SHIFT</div>
          
          {/* Checkpoints */}
          <div className="absolute bottom-6 left-[15%] text-[10px] text-slate-500 font-mono -translate-x-1/2">0h</div>
          <div className="absolute bottom-6 left-[40%] text-[10px] text-slate-500 font-mono -translate-x-1/2">24h</div>
          <div className="absolute bottom-6 left-[65%] text-[10px] text-slate-500 font-mono -translate-x-1/2">96h</div>
          <div className="absolute bottom-6 left-[90%] text-[10px] text-slate-300 font-bold font-mono -translate-x-1/2">168h</div>

          {/* Vertical Checkpoint Lines */}
          <div className="absolute top-0 bottom-12 left-[40%] w-px bg-white/5 border-l border-dashed border-slate-700"></div>
          <div className="absolute top-0 bottom-12 left-[65%] w-px bg-white/5 border-l border-dashed border-slate-700"></div>
          <div className="absolute top-0 bottom-12 left-[90%] w-px bg-white/5 border-l border-dashed border-slate-500/30"></div>

          {/* Trajectories */}
          <svg className="absolute inset-0 w-full h-full pb-12 pl-12" preserveAspectRatio="none" viewBox="0 0 100 100">
            {/* Normal Band */}
            <path d="M 5 60 C 25 58, 50 55, 75 52 C 100 49, 100 49, 100 49" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <path d="M 5 55 C 25 54, 50 54, 75 53 C 100 52, 100 52, 100 52" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            <path d="M 5 65 C 25 64, 50 64, 75 63 C 100 62, 100 62, 100 62" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" fill="none" />
            
            {/* Anomalous Trajectory */}
            <path d="M 5 58 L 34 56 L 62 35" stroke="#ef4444" strokeWidth="1.5" fill="none" />
            <circle cx="5" cy="58" r="1" fill="#ef4444" />
            <circle cx="34" cy="56" r="1.5" fill="#ef4444" />
            <circle cx="62" cy="35" r="2" fill="#ef4444" className="animate-pulse" />
            
            {/* Prediction */}
            <path d="M 62 35 L 90 10" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
            <circle cx="90" cy="10" r="2" fill="#f59e0b" />
          </svg>
          
          {/* Annotations */}
          <div className="absolute top-[30%] left-[55%] flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[9px] font-mono px-2 py-0.5 rounded">LOT-RELATIVE ANOMALY</div>
          </div>
          
          <div className="absolute top-[8%] left-[78%] flex flex-col items-start">
            <div className="text-amber-500 text-[9px] font-mono bg-black/50 px-1">Predicted trajectory → 168h</div>
          </div>
        </div>

      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="py-24 border-t border-white/5 bg-[#0a0b0e]">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-16 text-center">From Burn-In Data to Reliability Insight</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            
            <WorkflowStep num="01" title="UPLOAD" desc="CSV burn-in measurements" icon={<Database className="w-5 h-5"/>} />
            <WorkflowStep num="02" title="VALIDATE" desc="Check schema and quality" icon={<CheckCircle2 className="w-5 h-5"/>} />
            <WorkflowStep num="03" title="ANALYZE" desc="Lot stats & feature engineering" icon={<BarChart3 className="w-5 h-5"/>} />
            <WorkflowStep num="04" title="DETECT" desc="Identify lot-relative anomalies" icon={<Activity className="w-5 h-5"/>} />
            <WorkflowStep num="05" title="PREDICT" desc="Forecast drift toward 168h" icon={<ArrowUpRight className="w-5 h-5"/>} />
            <WorkflowStep num="06" title="EXPLAIN" desc="Show why component flagged" icon={<HelpCircle className="w-5 h-5"/>} />
            <WorkflowStep num="07" title="ACT" desc="Support QA inspection" icon={<ShieldCheck className="w-5 h-5"/>} last />

          </div>
        </div>
      </section>

      {/* Core Differentiator Section */}
      <section id="why-crip" className="py-24 bg-[#0a0b0e] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Thresholds Aren't Enough</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              CRIP looks beyond absolute limits to identify components whose behaviour is abnormal relative to their own lot.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* TRADITIONAL SCREENING */}
            <div className="bg-white/5 border border-white/10 p-8 rounded-xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-700"></div>
              <h3 className="text-sm font-bold text-slate-400 tracking-widest mb-8">TRADITIONAL SCREENING</h3>
              
              <div className="space-y-6 font-mono text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Component:</span>
                  <span className="text-white">410</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Absolute limit:</span>
                  <span className="text-slate-300">500</span>
                </div>
                
                <div className="pt-6">
                  <div className="text-slate-500 mb-2">Result:</div>
                  <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-500/10 px-4 py-3 rounded-md border border-emerald-500/20 w-fit">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="font-bold text-lg">PASS ✓</span>
                  </div>
                </div>
              </div>
            </div>

            {/* CRIP INTELLIGENCE */}
            <div className="bg-white/5 border border-slate-500/30 p-8 rounded-xl relative overflow-hidden backdrop-blur-sm shadow-[0_0_30px_rgba(255,255,255,0.02)]">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-300"></div>
              <h3 className="text-sm font-bold text-slate-300 tracking-widest mb-8">CRIP INTELLIGENCE</h3>
              
              <div className="space-y-6 font-mono text-sm">
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Component:</span>
                  <span className="text-white">410</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Lot average:</span>
                  <span className="text-slate-300">260</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2">
                  <span className="text-slate-500">Lot std deviation:</span>
                  <span className="text-slate-300">40</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-2 bg-red-500/5 px-2 -mx-2 rounded">
                  <span className="text-slate-500">Lot-relative deviation:</span>
                  <span className="text-red-400 font-bold">≈ 3.75σ</span>
                </div>
                
                <div className="pt-2">
                  <div className="text-slate-500 mb-2">Result:</div>
                  <div className="flex items-center space-x-2 text-red-400 bg-red-500/10 px-4 py-3 rounded-md border border-red-500/20 w-fit">
                    <AlertTriangle className="w-5 h-5" />
                    <span className="font-bold text-lg">ANOMALOUS ⚠</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Drift Prediction Section */}
      <section className="py-24 border-t border-white/5 bg-[#0A0A0C] overflow-hidden">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">See Where the Component Is Heading</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Early burn-in measurements are used to estimate future parameter drift. By forecasting out to the 168-hour mark, QA teams can preemptively screen components that are degrading faster than their lot peers.
            </p>
            <ul className="space-y-4 font-mono text-sm text-slate-300">
              <li className="flex items-center"><div className="w-3 h-0.5 bg-slate-400 mr-3"></div> Observed trajectory (0h - 96h)</li>
              <li className="flex items-center"><div className="w-3 h-0.5 bg-amber-500 border border-dashed border-black mr-3"></div> Predicted trajectory (168h)</li>
              <li className="flex items-center"><div className="w-3 h-3 bg-white/5 border border-white/20 mr-3 rounded-sm"></div> Normal population range</li>
            </ul>
          </div>
          
          <div className="w-full md:w-1/2">
            {/* Mini Chart Mockup */}
            <div className="bg-white/5 border border-white/10 p-6 rounded-xl aspect-[4/3] relative backdrop-blur-sm">
              <div className="absolute top-6 left-6 right-6 bottom-12 border-l border-b border-white/20"></div>
              {/* Normal range box */}
              <div className="absolute top-[40%] bottom-12 left-6 right-6 bg-slate-500/5 border border-slate-500/10"></div>
              {/* Line */}
              <svg className="absolute inset-0 w-full h-full p-6 pb-12" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path d="M 0 80 L 33 75 L 66 50" stroke="#94a3b8" strokeWidth="3" fill="none" />
                <path d="M 66 50 L 100 15" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" fill="none" />
                <circle cx="0" cy="80" r="3" fill="#0A0A0C" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="33" cy="75" r="3" fill="#0A0A0C" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="66" cy="50" r="3" fill="#0A0A0C" stroke="#94a3b8" strokeWidth="2" />
                <circle cx="100" cy="15" r="4" fill="#f59e0b" className="animate-pulse" />
              </svg>
              {/* X Axis */}
              <div className="absolute bottom-4 left-6 text-xs text-slate-500 font-mono -translate-x-1/2">0h</div>
              <div className="absolute bottom-4 left-[38%] text-xs text-slate-500 font-mono -translate-x-1/2">24h</div>
              <div className="absolute bottom-4 left-[70%] text-xs text-slate-500 font-mono -translate-x-1/2">96h</div>
              <div className="absolute bottom-4 right-6 text-xs text-amber-500 font-mono translate-x-1/2 font-bold">168h</div>
            </div>
          </div>
        </div>
      </section>

      {/* Explainability Section */}
      <section className="py-24 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row-reverse items-center gap-16">
          <div className="w-full md:w-1/2">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Don't Just Flag It.<br/>Explain It.</h2>
            <p className="text-slate-400 leading-relaxed mb-6">
              A QA inspector should understand exactly <strong>why</strong> the model flagged a component. CRIP breaks down the anomaly score into individual contributing risk factors.
            </p>
          </div>
          
          <div className="w-full md:w-1/2">
            {/* Mock Investigation Panel */}
            <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="bg-white/5 px-6 py-4 border-b border-white/5 flex justify-between items-center">
                <span className="font-mono text-white font-bold">CMP-0427</span>
                <span className="text-xs font-bold px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded">HIGH RISK</span>
              </div>
              <div className="p-6">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6">Why was it flagged?</h4>
                <div className="space-y-4">
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-[10px] text-slate-500 font-mono">01</div>
                      <div className="text-sm text-white">Lot-relative deviation</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[90%]"></div>
                      </div>
                      <span className="text-xs text-red-400 font-medium">High</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-[10px] text-slate-500 font-mono">02</div>
                      <div className="text-sm text-white">Recent drift acceleration</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[75%]"></div>
                      </div>
                      <span className="text-xs text-amber-400 font-medium">High</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-[10px] text-slate-500 font-mono">03</div>
                      <div className="text-sm text-slate-300">Predicted 168h trajectory</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500 w-[50%]"></div>
                      </div>
                      <span className="text-xs text-yellow-400 font-medium">Moderate</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-[10px] text-slate-500 font-mono">04</div>
                      <div className="text-sm text-slate-400">Absolute Temperature</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-slate-500 w-[15%]"></div>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Low</span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* About Section */}
      <section id="about" className="py-24 bg-[#0A0A0C] border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Built for Reliability-Critical Decisions</h2>
          <p className="text-slate-400 leading-relaxed mb-12">
            CRIP is a decision-support prototype for component burn-in and environmental screening. It combines lot-relative anomaly detection, early drift prediction, risk assessment, and explainability into one automated QA workflow.
          </p>
          
          <div className="flex flex-col items-center justify-center p-6 bg-amber-500/5 border border-amber-500/20 rounded-xl mt-8 max-w-2xl mx-auto backdrop-blur-sm">
            <AlertTriangle className="w-6 h-6 text-amber-500 mb-3" />
            <h4 className="text-sm font-bold text-amber-400 mb-2">Prototype • Synthetic demonstration data</h4>
            <p className="text-xs text-slate-400 text-center leading-relaxed">Real-world qualification requires validation against actual component and screening data. Current models are demonstrated using synthetic distributions.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#0A0A0C] py-12 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="flex items-center space-x-2 mb-6">
            <RoboticArmIcon className="w-10 h-10" />
            <span className="font-bold tracking-widest text-slate-500">CRIP</span>
          </div>
          <p className="text-xs text-slate-600">© 2026 Component Reliability Intelligence Platform.</p>
        </div>
      </footer>
    </div>
  );
}

function WorkflowStep({ num, title, desc, icon, last = false }: { num: string, title: string, desc: string, icon: React.ReactNode, last?: boolean }) {
  return (
    <div className="flex flex-col items-center text-center relative group">
      <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 mb-4 z-10 group-hover:border-slate-300 group-hover:text-white transition-colors backdrop-blur-sm">
        {icon}
      </div>
      <div className="text-[10px] text-slate-500 font-mono mb-1">{num}</div>
      <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500">{desc}</p>
      
      {!last && (
        <div className="hidden lg:block absolute top-6 left-[60%] w-[80%] h-px bg-white/10">
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 border-t border-r border-white/30 rotate-45"></div>
        </div>
      )}
    </div>
  );
}
