'use client';

import { Button } from '@/components/ui/button';
import { FractFlowIcon } from '@/components/icons/FractFlowIcon';
import { Sparkles, Zap, Shield, Users, ArrowUpRight, FileText, Share2, MousePointer2, Code2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export function LandingView() {
  const t = useTranslations('landing');
  
  const scrollToShowcase = () => {
    const element = document.getElementById('showcase');
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="h-[calc(100dvh-4rem)] w-full overflow-y-auto overflow-x-hidden snap-y snap-mandatory scroll-smooth bg-background selection:bg-primary/20 no-scrollbar relative">
      {/* Page 1: Hero Section */}
      <section className="w-full h-full snap-start snap-always flex flex-col justify-center items-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background overflow-hidden relative">
        <div className="container px-4 md:px-8 mx-auto relative z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="flex flex-col items-center space-y-10 text-center max-w-5xl mx-auto">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-[0.3em] mb-4 border border-primary/20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <Sparkles className="h-4 w-4" />
                <span>{t('hero.future')}</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl/none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                {t.rich('hero.title', {
                  vision: (chunks) => (
                    <span className="relative inline-block">
                      <span className="text-primary relative z-10">{chunks}</span>
                      <span className="absolute bottom-[-2%] left-0 w-full h-[11%] bg-primary/40 -skew-x-12 z-0" />
                    </span>
                  )
                })}
              </h1>
              <p className="mx-auto max-w-[820px] text-muted-foreground text-lg md:text-xl lg:text-2xl leading-relaxed font-medium animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-300">
                {t('hero.description')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-6 animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-500">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-[220px] rounded-2xl h-16 sm:h-18 text-xl sm:text-2xl font-black shadow-[0_20px_50px_-10px_rgba(var(--primary-rgb),0.4)] hover:scale-105 active:scale-95 transition-all duration-300">
                  {t('hero.get_started')}
                  <ArrowUpRight className="ml-1 h-6 w-6 stroke-[3px]" />
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-[220px] rounded-2xl h-16 sm:h-18 text-xl sm:text-2xl font-bold hover:bg-secondary/50 border-2 transition-all duration-300"
                onClick={scrollToShowcase}
              >
                {t('hero.watch_demo')}
              </Button>
            </div>
          </div>
        </div>
        <ScrollGuide direction="down" label={t('features.capabilities')} />
      </section>

      {/* Page 2: Features Section */}
      <section className="w-full h-full snap-start snap-always flex flex-col justify-center py-0 bg-secondary/5 relative border-y overflow-x-hidden overflow-y-visible border-border">
        <ScrollGuide direction="up" label="Back to Top" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 blur-[150px] rounded-full pointer-events-none -translate-y-1/2 translate-x-1/4" />
        
        <div className="container px-4 md:px-8 mx-auto relative z-10 translate-y-3 md:translate-y-4">
          <div className="flex flex-col items-center text-center mb-5 md:mb-20 space-y-2.5 md:space-y-4">
            <h3 className="text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black tracking-tight leading-tight">
              {t.rich('features.title', {
                master: (chunks) => <span className="text-muted-foreground">{chunks}</span>
              })}
            </h3>
            <p className="max-w-xl md:max-w-2xl text-muted-foreground text-base sm:text-lg md:text-lg lg:text-xl font-medium">
              {t('features.description')}
            </p>
          </div>

          <div className="flex xl:grid xl:grid-cols-4 gap-4 md:gap-6 xl:gap-8 overflow-x-auto overflow-y-visible xl:overflow-visible snap-x snap-mandatory xl:snap-none no-scrollbar pt-3 md:pt-4 pb-6 md:pb-7 xl:pb-0 max-w-none mx-auto w-full px-3 md:px-4 scroll-px-3 md:scroll-px-4">
            <FeatureCard 
              icon={<Zap className="h-9 w-9" />}
              title={t('features.f1.title')}
              description={t('features.f1.description')}
            />
            <FeatureCard 
              icon={<FileText className="h-9 w-9" />}
              title={t('features.f2.title')}
              description={t('features.f2.description')}
            />
            <FeatureCard 
              icon={<Shield className="h-9 w-9" />}
              title={t('features.f3.title')}
              description={t('features.f3.description')}
            />
            <FeatureCard 
              icon={<Users className="h-9 w-9" />}
              title={t('features.f4.title')}
              description={t('features.f4.description')}
            />
          </div>
          <div className="xl:hidden -mt-1 flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground/70">
            <span>Swipe cards</span>
            <ChevronRight className="h-3.5 w-3.5 animate-pulse" />
          </div>
        </div>
        <ScrollGuide direction="down" label={t('showcase.title')} />
      </section>

      {/* Page 3: Showcase Section */}
      <section id="showcase" className="w-full h-full snap-start snap-always flex flex-col justify-center bg-background relative overflow-hidden">
        <ScrollGuide direction="up" label={t('features.capabilities')} />
        <div className="container px-4 md:px-8 mx-auto relative">
          <div className="flex flex-col items-center justify-center space-y-4 md:space-y-5 text-center">
            <div className="space-y-2.5 md:space-y-3 max-w-3xl">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl md:text-4xl lg:text-5xl xl:text-5xl">{t('showcase.title')}</h2>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed font-medium">
                {t('showcase.description')}
              </p>
            </div>
            
            <div className="w-full max-w-[95vw] md:max-w-[820px] xl:max-w-[900px] aspect-[16/11] sm:aspect-[16/10] xl:aspect-[16/10] bg-card/30 rounded-[2rem] xl:rounded-[2.5rem] border-2 border-border/60 shadow-2xl relative overflow-hidden group p-3 md:p-4 xl:p-5 flex items-center justify-center">
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

              <div className="relative w-full h-full z-20 scale-[0.82] sm:scale-[0.88] md:scale-[0.92] lg:scale-[0.94] xl:scale-[0.95] origin-top transition-transform duration-300">
                <div className="absolute top-[3%] left-1/2 -translate-x-1/2 bg-background border-2 border-border/80 px-7 md:px-10 xl:px-12 py-3.5 md:py-5 xl:py-6 rounded-[2rem] xl:rounded-[2.5rem] shadow-2xl transition-all group-hover:border-primary/40 group-hover:scale-105 duration-500 z-30">
                  <span className="text-xl md:text-2xl xl:text-3xl font-black tracking-tight flex items-center gap-2.5 md:gap-3 uppercase">
                    <FractFlowIcon className="h-6 w-6 md:h-7 md:w-7 xl:h-8 xl:w-8 text-primary" />
                    FractFlow
                  </span>
                </div>

                <div className="absolute top-[26%] md:top-[30%] left-[24%] md:left-[27%] w-[clamp(180px,24vw,300px)] -translate-x-1/2 bg-background border-2 border-border/60 px-4 md:px-7 xl:px-10 py-3 md:py-5 xl:py-6 rounded-2xl xl:rounded-3xl shadow-xl transition-all group-hover:border-emerald-500/40 group-hover:translate-y-[-10px] duration-700 text-center z-30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Phase 01</span>
                    <span className="text-base md:text-xl xl:text-2xl font-black">Market Research</span>
                  </div>
                </div>

                <div className="absolute top-[26%] md:top-[30%] left-[76%] md:left-[73%] w-[clamp(180px,24vw,300px)] -translate-x-1/2 bg-background border-2 border-border/60 px-4 md:px-7 xl:px-10 py-3 md:py-5 xl:py-6 rounded-2xl xl:rounded-3xl shadow-xl transition-all group-hover:border-amber-500/40 group-hover:translate-y-[-10px] duration-700 delay-100 text-center z-30">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-xs font-black uppercase tracking-widest opacity-60">Phase 02</span>
                    <span className="text-base md:text-xl xl:text-2xl font-black">UI/UX Design</span>
                  </div>
                </div>

                <div className="absolute bottom-[-30px] md:bottom-[1.5%] left-[30%] -translate-x-1/2 bg-background border-2 border-border/80 p-4 md:p-6 xl:p-8 rounded-[1.8rem] xl:rounded-[2.5rem] shadow-2xl w-[clamp(250px,36vw,420px)] transition-all group-hover:translate-y-[-10px] duration-700 delay-200 z-30">
                  <div className="flex items-center justify-between mb-3 md:mb-4 xl:mb-5">
                    <div className="flex items-center gap-2">
                      <Code2 className="h-5 w-5 text-primary" />
                      <span className="text-[11px] md:text-xs xl:text-sm font-black text-muted-foreground uppercase tracking-wider">CONFIG SETUP</span>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500/40" />
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/40" />
                    </div>
                  </div>
                  <div className="bg-[#121212] p-4 md:p-5 xl:p-7 rounded-2xl font-mono text-[11px] md:text-xs xl:text-[13px] leading-relaxed overflow-hidden border border-white/5 shadow-inner text-left">
                  <div className="text-purple-400">export const <span className="text-blue-300">config</span> = {'{'}</div>
                  <div className="pl-4 text-white/90">
                    <span className="text-blue-200">framework</span>: <span className="text-emerald-400">&apos;Next.js 16&apos;</span>,
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
                  <span className="text-base font-bold">{t('showcase.active')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <ScrollGuide direction="down" label={t('cta.button')} />
      </section>

      {/* Page 4: Final CTA & Footer Section */}
      <footer className="w-full h-full snap-start snap-always relative flex flex-col justify-between bg-background overflow-hidden border-t border-border">
        <ScrollGuide direction="up" label={t('showcase.title')} />
        
        {/* Top: Final CTA Section */}
        <div className="flex-[1.35] md:flex-1 flex flex-col items-center justify-center text-center space-y-8 md:space-y-10 relative px-4 pt-10 md:pt-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(var(--primary-rgb),0.05)_0%,transparent_70%)] pointer-events-none" />
          <div className="space-y-4 relative z-10">
            <h3 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight">
              {t.rich('cta.title', {
                vision: (chunks) => <span className="text-primary">{chunks}</span>
              })}
            </h3>
            <p className="max-w-xl md:max-w-2xl mx-auto text-muted-foreground text-lg md:text-2xl font-medium">
              {t('cta.description')}
            </p>
          </div>
          <Link href="/login" className="relative z-10">
            <Button size="lg" className="rounded-2xl px-12 md:px-16 h-16 md:h-20 text-xl md:text-2xl font-black shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-300">
              {t('cta.button')}
              <ArrowUpRight className="ml-2 h-6 w-6 md:h-7 md:w-7 stroke-[3px]" />
            </Button>
          </Link>
        </div>

        {/* Bottom: Links & Info with FULL WIDTH BORDER */}
        <div className="w-full border-t border-border bg-card/30 backdrop-blur-xl shrink-0">
          <div className="container mx-auto px-4 md:px-8 py-8 md:py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-12 max-w-5xl mx-auto text-center md:text-left mb-8 md:mb-16">
              <FooterSection title={t('footer.product')} links={['Features', 'Showcase', 'Security']} />
              <FooterSection title={t('footer.resources')} links={['Documentation', 'API Reference', 'Community']} />
              <FooterSection title={t('footer.company')} links={['About Us', 'Privacy Policy', 'Terms']} />
              <FooterSection title={t('footer.connect')} links={['Twitter / X', 'GitHub', 'LinkedIn']} />
            </div>
            
            <div className="pt-6 md:pt-12 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
              <div className="flex items-center gap-3">
                <FractFlowIcon className="h-8 w-8 text-primary" />
                <p className="text-sm font-bold text-muted-foreground tracking-tight opacity-60">{t('footer.rights')}</p>
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
    <div className="flex flex-col items-start text-left gap-5 p-7 md:p-8 xl:p-10 rounded-[2rem] xl:rounded-[2.5rem] border bg-background/50 backdrop-blur-md shadow-sm hover:shadow-2xl hover:border-primary/20 hover:-translate-y-2 transition-all duration-500 group transform-gpu will-change-transform z-10 min-h-[250px] md:min-h-[280px] xl:min-h-0 w-[calc(100vw-2.5rem)] max-w-[22rem] sm:w-[24rem] sm:max-w-none lg:w-[26rem] xl:w-full xl:min-w-0 shrink-0 snap-center mx-auto">
      <div className="p-4 xl:p-5 rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-inner shrink-0">
        {icon}
      </div>
      <div className="space-y-2.5 xl:space-y-3 w-full max-w-none">
        <h3 className="text-2xl md:text-2xl xl:text-2xl font-black tracking-tight leading-tight">{title}</h3>
        <p className="text-muted-foreground text-lg leading-relaxed font-medium overflow-hidden [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] xl:[-webkit-line-clamp:unset] xl:[display:block]">
          {description}
        </p>
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
