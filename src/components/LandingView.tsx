'use client';

import { Button } from '@/components/ui/button';
import { BrainCircuit, Sparkles, Zap, Shield, Users, ArrowUpRight, FileText, Share2, MousePointer2, Code2, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';

export function LandingView() {
  const scrollToShowcase = () => {
    const element = document.getElementById('showcase');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-background selection:bg-primary/20 no-scrollbar relative">
      {/* Page 1: Hero Section */}
      <section className="w-full h-full snap-start snap-always flex flex-col justify-center items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background overflow-hidden relative">
        <div className="container px-4 md:px-8 mx-auto relative z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.3em] mb-4 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="h-4 w-4" />
                <span>The Future of Visualization</span>
              </div>
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl md:text-8xl lg:text-9xl/none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                Map Your <span className="relative inline-block">
                  <span className="text-primary italic relative z-10">Vision</span>
                  <span className="absolute bottom-[-2%] left-0 w-full h-[11%] bg-primary/40 -skew-x-12 z-0" />
                </span> to Infinity
              </h1>
              <p className="mx-auto max-w-[850px] text-muted-foreground text-xl md:text-2xl lg:text-3xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                The high-performance, AI-powered workspace designed for modern product strategy, complex research, and creative brainstorming.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-[240px] rounded-2xl h-20 text-2xl font-black shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all duration-300">
                  Get Started
                  <ArrowUpRight className="ml-1 h-7 w-7 stroke-[3px]" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-[240px] rounded-2xl h-20 text-2xl font-bold hover:bg-secondary/50 border-2 transition-all duration-300"
                onClick={scrollToShowcase}
              >
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
        <ScrollGuide direction="down" label="Capabilities" />
      </section>

      {/* Page 2: Features Section */}
      <section className="w-full h-full snap-start snap-always flex flex-col justify-center bg-secondary/5 relative border-y overflow-hidden border-border">
        <ScrollGuide direction="up" label="Back to Top" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
        
        <div className="container px-4 md:px-8 mx-auto relative z-10 -translate-y-12">
          <div className="flex flex-col items-center text-center mb-20 space-y-4">
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-primary">Capabilities</h2>
            <h3 className="text-4xl md:text-6xl font-black tracking-tight">Everything You Need to <br /><span className="text-muted-foreground">Master Your Workflow</span></h3>
            <p className="max-w-2xl text-muted-foreground text-lg md:text-xl font-medium">
              Our workspace combines the simplicity of mind-mapping with the power of modern engineering tools.
            </p>
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <FeatureCard 
              icon={<Zap className="h-8 w-8" />}
              title="Instant Nodes"
              description="Expand your map instantly with keyboard shortcuts and smooth drag-and-drop interactions."
            />
            <FeatureCard 
              icon={<FileText className="h-8 w-8" />}
              title="Markdown Ready"
              description="Document your ideas with rich text, nested lists, and multi-line markdown blocks inside any node."
            />
            <FeatureCard 
              icon={<Shield className="h-8 w-8" />}
              title="Enterprise Security"
              description="Secure your intellectual property with Supabase Auth and private database isolation."
            />
            <FeatureCard 
              icon={<Users className="h-8 w-8" />}
              title="Dynamic Scaling"
              description="Built on a high-performance engine capable of handling thousands of nodes without lag."
            />
          </div>
        </div>
        <ScrollGuide direction="down" label="Showcase" />
      </section>

      {/* Page 3: Showcase Section */}
      <section id="showcase" className="w-full h-full snap-start snap-always flex flex-col justify-center bg-background relative overflow-hidden">
        <ScrollGuide direction="up" label="Features" />
        <div className="container px-4 md:px-8 mx-auto relative">
          <div className="flex flex-col items-center justify-center space-y-6 text-center">
            <div className="space-y-3 max-w-3xl">
              <h2 className="text-4xl font-black tracking-tight sm:text-7xl">Powerful Editor Experience</h2>
              <p className="text-muted-foreground text-xl md:text-2xl leading-relaxed font-medium">
                Experience a high-performance workspace with auto-layout, real-time sync, and intelligent connections.
              </p>
            </div>
            
            <div className="w-full max-w-5xl aspect-[16/10] bg-card/30 rounded-[3rem] border-2 border-border/60 shadow-2xl relative overflow-hidden group p-8 flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary/[0.03] via-transparent to-transparent pointer-events-none" />
              
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 1000 625">
                <path 
                  d="M500,100 C500,180 300,140 300,220" 
                  fill="none" 
                  className="stroke-muted-foreground/20 dark:stroke-muted-foreground/10 transition-all duration-500 group-hover:stroke-primary/30" 
                  strokeWidth="1.2" 
                />
                <path 
                  d="M500,100 C500,180 700,140 700,220" 
                  fill="none" 
                  className="stroke-muted-foreground/20 dark:stroke-muted-foreground/10 transition-all duration-500 group-hover:stroke-primary/30" 
                  strokeWidth="1.2" 
                />
              </svg>

              <div className="relative w-full h-full z-20">
                <div className="absolute top-[3%] left-1/2 -translate-x-1/2 bg-background border-2 border-border/80 px-12 py-6 rounded-[2.5rem] shadow-2xl transition-all group-hover:border-primary/40 group-hover:scale-105 duration-500 z-30">
                  <span className="text-3xl font-black tracking-tight flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    Product Strategy
                  </span>
                </div>

                <div className="absolute top-[30%] left-[30%] w-[300px] -translate-x-1/2 bg-background border-2 border-border/60 px-10 py-6 rounded-3xl shadow-xl transition-all group-hover:border-emerald-500/40 group-hover:translate-y-[-10px] duration-700 text-center z-30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Phase 01</span>
                    <span className="text-2xl font-black">Market Research</span>
                  </div>
                </div>

                <div className="absolute top-[30%] left-[70%] w-[300px] -translate-x-1/2 bg-background border-2 border-border/60 px-10 py-6 rounded-3xl shadow-xl transition-all group-hover:border-amber-500/40 group-hover:translate-y-[-10px] duration-700 delay-100 text-center z-30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Phase 02</span>
                    <span className="text-2xl font-black">UI/UX Design</span>
                  </div>
                </div>

                <div className="absolute bottom-[0.5%] left-[30%] -translate-x-1/2 bg-background border-2 border-border/80 p-8 rounded-[2.5rem] shadow-2xl w-[420px] transition-all group-hover:translate-y-[-10px] duration-700 delay-200 z-30">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      <span className="text-sm font-black text-muted-foreground uppercase tracking-wider">CONFIG SETUP</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                  </div>
                  <div className="bg-[#121212] p-7 rounded-2xl font-mono text-[13px] leading-relaxed overflow-hidden border border-white/5 shadow-inner text-left">
                    <div className="text-purple-400">export const <span className="text-blue-300">config</span> = {'{'}</div>
                    <div className="pl-4 text-white/90">
                      <span className="text-blue-200">framework</span>: <span className="text-emerald-400">&apos;Next.js 15&apos;</span>,
                    </div>
                    <div className="pl-4 text-white/90">
                      <span className="text-blue-200">database</span>: <span className="text-emerald-400">&apos;Supabase&apos;</span>,
                    </div>
                    <div className="pl-4 text-white/90">
                      <span className="text-blue-200">auth</span>: <span className="text-emerald-400">&apos;Auth SSR&apos;</span>
                    </div>
                    <div className="text-purple-400">{'}'};</div>
                  </div>
                </div>

                <div className="absolute bottom-[35%] right-[12%] bg-accent border-2 border-primary/20 px-6 py-4 rounded-[2rem] text-sm font-bold shadow-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 translate-y-4 group-hover:translate-y-0 flex items-center gap-3 bg-background/80 backdrop-blur-md z-30">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                     <MousePointer2 className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-base font-bold">Real-time collaboration active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ScrollGuide direction="down" label="Get Started" />
      </section>

      {/* Page 4: Final CTA & Footer Section */}
      <footer className="w-full h-full snap-start snap-always relative flex flex-col justify-between bg-background overflow-hidden border-t border-border">
        <ScrollGuide direction="up" label="Back to Showcase" />
        
        {/* Top: Final CTA Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-10 relative px-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <h3 className="text-4xl md:text-7xl font-black tracking-tight">Ready to Map Your <br /><span className="text-primary italic">Next Big Idea?</span></h3>
            <p className="max-w-2xl mx-auto text-muted-foreground text-xl md:text-2xl font-medium">
              Join thousands of visionary teams organizing their thoughts with MindMap AI.
            </p>
          </div>
          <Link href="/login" className="relative z-10">
            <Button size="lg" className="rounded-2xl px-16 h-20 text-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300">
              Get Started for Free
              <ArrowUpRight className="ml-2 h-7 w-7 stroke-[3px]" />
            </Button>
          </Link>
        </div>

        {/* Bottom: Links & Info with FULL WIDTH BORDER */}
        <div className="w-full border-t border-border bg-card/30 backdrop-blur-xl">
          <div className="container mx-auto px-4 md:px-8 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 max-w-5xl mx-auto text-center md:text-left mb-16">
              <FooterSection title="Product" links={['Features', 'Showcase', 'Security']} />
              <FooterSection title="Resources" links={['Documentation', 'API Reference', 'Community']} />
              <FooterSection title="Company" links={['About Us', 'Privacy Policy', 'Terms']} />
              <FooterSection title="Connect" links={['Twitter / X', 'GitHub', 'LinkedIn']} />
            </div>
            
            <div className="pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <BrainCircuit className="h-8 w-8 text-primary" />
                <p className="text-sm font-bold text-muted-foreground tracking-tight opacity-60">© 2026 MindMap AI. Designed for visionary teams.</p>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center hover:bg-primary/20 transition-colors cursor-pointer border border-border/50">
                  <Share2 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterSection({ title, links }: { title: string, links: string[] }) {
  return (
    <div className="space-y-5">
      <h4 className="font-black uppercase tracking-[0.2em] text-[10px] text-primary">{title}</h4>
      <ul className="space-y-3 text-sm font-bold text-muted-foreground/80">
        {links.map(link => (
          <li key={link} className="hover:text-primary transition-colors cursor-pointer">{link}</li>
        ))}
      </ul>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-start space-y-6 p-10 rounded-[2.5rem] border bg-background/50 backdrop-blur-md shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-500 group transform-gpu will-change-transform z-10">
      <div className="p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner">
        {icon}
      </div>
      <div className="space-y-3">
        <h3 className="text-2xl font-black tracking-tight">{title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium">{description}</p>
      </div>
    </div>
  );
}

function ScrollGuide({ direction, label }: { direction: 'up' | 'down', label: string }) {
  return (
    <div className={`absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-20 ${direction === 'up' ? 'top-4' : 'bottom-4'}`}>
      {direction === 'up' && (
        <>
          <ChevronUp className="h-5 w-5 text-primary opacity-20 animate-bounce duration-1000" />
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 leading-none mt-2">{label}</span>
        </>
      )}
      {direction === 'down' && (
        <>
          <span className="text-[8px] font-black uppercase tracking-[0.4em] text-muted-foreground/20 leading-none mb-2">{label}</span>
          <ChevronDown className="h-5 w-5 text-primary opacity-20 animate-bounce duration-1000" />
        </>
      )}
    </div>
  );
}
