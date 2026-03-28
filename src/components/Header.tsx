'use client';

import { Link } from '@/i18n/navigation';
import { LogOut, LayoutDashboard, Plus, CloudCheck, CloudUpload, Languages, Menu, CircleHelp, Sparkles, ArrowLeft } from 'lucide-react';
import { FractFlowIcon } from '@/components/icons/FractFlowIcon';
import { ModeToggle } from '@/components/mode-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from '@/i18n/navigation';
import { useEffect, useRef, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { useMindMapStore } from '@/store/useMindMapStore';
import { useTranslations, useLocale } from 'next-intl';
import { useTheme } from 'next-themes';
import { trackUXEvent } from '@/lib/ux-events';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

type HelpTab = 'quick' | 'mobile' | 'desktop';

const helpCopy = {
  en: {
    title: 'How to Use FractFlow',
    description: 'Quick guide for mind-map editing on desktop and mobile.',
    tabs: {
      quick: 'Quick Start',
      mobile: 'Mobile',
      desktop: 'Desktop',
    },
    quick: [
      'Create a node: tap + in mobile mode bar, or right-click canvas on desktop.',
      'Edit content: use node action sheet on mobile, or double-click on desktop.',
      'Connect ideas: enter Connect mode, pick source anchor, then tap target node.',
    ],
    mobile: [
      'Long-press empty canvas to add a node quickly.',
      'Long-press a node to open action sheet (edit, color, connect, delete).',
      'Use Resize mode for larger corner handles and safer touch resizing.',
    ],
    desktop: [
      'Right-click canvas to add a node at cursor position.',
      'Right-click node to open color palette.',
      'Double-click node to open markdown editor.',
    ],
  },
  ko: {
    title: 'FractFlow 사용 가이드',
    description: '데스크톱/모바일 마인드맵 편집 방법을 빠르게 확인하세요.',
    tabs: {
      quick: '빠른 시작',
      mobile: '모바일',
      desktop: '데스크톱',
    },
    quick: [
      '노드 생성: 모바일은 모드바의 + 버튼, 데스크톱은 캔버스 우클릭.',
      '내용 편집: 모바일은 노드 액션시트, 데스크톱은 더블클릭.',
      '연결: 연결 모드 진입 후 소스 앵커 선택, 이후 타깃 노드를 탭.',
    ],
    mobile: [
      '빈 캔버스를 길게 눌러 노드를 빠르게 생성할 수 있습니다.',
      '노드를 길게 누르면 액션시트(편집/색상/연결/삭제)가 열립니다.',
      '리사이즈 모드에서는 코너 핸들이 커져 터치 조작이 쉬워집니다.',
    ],
    desktop: [
      '캔버스를 우클릭하면 해당 위치에 노드가 생성됩니다.',
      '노드를 우클릭하면 색상 팔레트가 열립니다.',
      '노드를 더블클릭하면 마크다운 편집기가 열립니다.',
    ],
  },
} as const;

function HelpPanel({ locale, tab, onTabChange }: { locale: 'en' | 'ko'; tab: HelpTab; onTabChange: (tab: HelpTab) => void }) {
  const copy = helpCopy[locale];

  return (
    <div className="space-y-4">
      <PopoverHeader className="space-y-1">
        <PopoverTitle className="text-sm font-bold tracking-tight">{copy.title}</PopoverTitle>
        <PopoverDescription className="text-xs">{copy.description}</PopoverDescription>
      </PopoverHeader>

      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        <Button type="button" variant={tab === 'quick' ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => onTabChange('quick')}>
          {copy.tabs.quick}
        </Button>
        <Button type="button" variant={tab === 'mobile' ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => onTabChange('mobile')}>
          {copy.tabs.mobile}
        </Button>
        <Button type="button" variant={tab === 'desktop' ? 'secondary' : 'ghost'} size="sm" className="h-8 text-xs" onClick={() => onTabChange('desktop')}>
          {copy.tabs.desktop}
        </Button>
      </div>

      <div className="space-y-2">
        {(tab === 'quick' ? copy.quick : tab === 'mobile' ? copy.mobile : copy.desktop).map((line) => (
          <div key={line} className="flex items-start gap-2 rounded-md border border-border/60 bg-card/60 px-2.5 py-2 text-xs leading-relaxed">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <p>{line}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Header() {
  const t = useTranslations('common');
  const locale = useLocale();
  const [user, setUser] = useState<User | null>(null);
  const [helpTab, setHelpTab] = useState<HelpTab>('quick');
  const [isEditingMobileTitle, setIsEditingMobileTitle] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const mobileTitleInputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const isSaving = useMindMapStore((state) => state.isSaving);
  const canEdit = useMindMapStore((state) => state.canEdit);
  const title = useMindMapStore((state) => state.title);
  const setTitle = useMindMapStore((state) => state.setTitle);
  const helpSheetOpen = useMindMapStore((state) => state.helpSheetOpen);
  const setHelpSheetOpen = useMindMapStore((state) => state.setHelpSheetOpen);
  const { setTheme } = useTheme();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileViewport(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  };

  const isMapPage = pathname.startsWith('/map');

  const switchLocale = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  const resolvedLocale = locale === 'ko' ? 'ko' : 'en';
  const compactActionLabelClass = isMapPage ? 'hidden min-[1025px]:inline' : 'hidden md:inline';
  const isMobileMapPage = isMapPage && isMobileViewport;

  useEffect(() => {
    if (!isMobileMapPage || !isEditingMobileTitle) return;
    const rafId = window.requestAnimationFrame(() => {
      if (!mobileTitleInputRef.current) return;
      mobileTitleInputRef.current.focus();
      const cursor = mobileTitleInputRef.current.value.length;
      mobileTitleInputRef.current.setSelectionRange(cursor, cursor);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [isMobileMapPage, isEditingMobileTitle]);
  const handleHelpOpenChange = (next: boolean) => {
    setHelpSheetOpen(next);
    if (next && !helpSheetOpen) {
      trackUXEvent('help_sheet_opened', { surface: isMobileViewport ? 'mobile' : 'desktop' });
      trackUXEvent('help_opened', { surface: isMobileViewport ? 'mobile' : 'desktop' });
    }
  };

  const helpButton = (
    <Button variant="ghost" size="sm" className="w-9 px-0 rounded-full" aria-label={resolvedLocale === 'ko' ? '사용 가이드 열기' : 'Open usage guide'}>
      <CircleHelp className="h-5 w-5" />
    </Button>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={`mx-auto relative flex h-16 w-full max-w-screen-xl items-center px-3 transition-all duration-300 md:px-6 lg:px-10 ${isMapPage ? 'xl:px-12' : 'xl:px-8'}`}>
        {isMapPage && !canEdit && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
            <div className="rounded-full border border-border/50 bg-muted/80 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground shadow-sm backdrop-blur">
              {resolvedLocale === 'ko' ? '읽기 전용' : 'Read only'}
            </div>
          </div>
        )}
        <div className="flex min-w-0 items-center gap-3 md:gap-6">
          {isMobileMapPage ? (
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={resolvedLocale === 'ko' ? '뒤로 가기' : 'Go back'}
                  className="h-10 w-10 shrink-0 rounded-full"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className={cn("min-w-0 flex-1", isMobileMapPage && isEditingMobileTitle ? "border-b border-border/60" : "border-b border-transparent")}>
                {isMobileMapPage && isEditingMobileTitle ? (
                  <Input
                    ref={mobileTitleInputRef}
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => setIsEditingMobileTitle(false)}
                    readOnly={!canEdit}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === 'Escape') {
                        e.preventDefault();
                        setIsEditingMobileTitle(false);
                      }
                    }}
                    className="h-10 w-full border-none bg-transparent px-0 text-sm font-bold focus-visible:ring-0"
                    placeholder={resolvedLocale === 'ko' ? '제목 없음' : 'Untitled Map'}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!canEdit) {
                        toast.error(resolvedLocale === 'ko' ? '수정 권한이 없습니다.' : "You don't have permission to edit this map.", { id: 'permission-denied-edit' });
                        return;
                      }
                      setIsEditingMobileTitle(true);
                    }}
                    className="h-10 w-full truncate bg-transparent text-left text-sm font-bold leading-10"
                    title={title || (resolvedLocale === 'ko' ? '제목 없음' : 'Untitled Map')}
                    aria-label={resolvedLocale === 'ko' ? '마인드맵 제목 수정' : 'Edit mind map title'}
                  >
                    {title || (resolvedLocale === 'ko' ? '제목 없음' : 'Untitled Map')}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <Link href="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
              <FractFlowIcon className="h-7 w-7 text-primary" />
              <span className="text-lg font-black tracking-tight uppercase sm:text-xl">FractFlow</span>
            </Link>
          )}
          
          {isMapPage && !isMobileMapPage && canEdit && (
            <div className="flex items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-1.5 py-1 transition-all duration-300 sm:gap-2 sm:px-3">
              {isSaving ? (
                <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-widest text-primary leading-none">
                  <CloudUpload className="h-3.5 w-3.5 shrink-0 self-center animate-pulse" />
                  <span className="self-center animate-pulse">{t('syncing')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 sm:gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-[0.12em] sm:tracking-widest text-muted-foreground/80 leading-none">
                  <CloudCheck className="h-3.5 w-3.5 shrink-0 self-center text-green-500/80" />
                  <span className="self-center">{t('saved')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex-1" />

        <nav className="hidden items-center gap-2 md:flex md:gap-4">
          {isMapPage && !isMobileViewport && (
            <Popover open={helpSheetOpen} onOpenChange={handleHelpOpenChange}>
              <PopoverTrigger asChild>{helpButton}</PopoverTrigger>
              <PopoverContent align="end" className="w-[360px] p-4">
                <HelpPanel locale={resolvedLocale} tab={helpTab} onTabChange={setHelpTab} />
              </PopoverContent>
            </Popover>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="w-9 px-0">
                <Languages className="h-4 w-4" />
                <span className="sr-only">Toggle language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => switchLocale('en')} className={locale === 'en' ? "bg-accent" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale('ko')} className={locale === 'ko' ? "bg-accent" : ""}>
                한국어
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <ModeToggle />
          
          {user ? (
            <>
              <Link href="/">
                <Button variant="ghost" size="sm" className={pathname === '/' ? "bg-accent" : ""}>
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span className={compactActionLabelClass}>{t('dashboard')}</span>
                </Button>
              </Link>
              <Link href="/map/new">
                <Button variant="ghost" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  <span className={compactActionLabelClass}>{t('new_map')}</span>
                </Button>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                {t('sign_out')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="font-bold">
                  {t('sign_in')}
                </Button>
              </Link>
              <Link href="/login">
                <Button size="sm" className="font-bold rounded-xl px-5">
                  {t('get_started')}
                </Button>
              </Link>
            </>
          )}
        </nav>

        <nav className="md:hidden flex items-center gap-1">
          {isMobileMapPage && canEdit && (
            <div className="flex shrink-0 items-center gap-1 rounded-full border border-border/40 bg-muted/40 px-2.5 py-1 whitespace-nowrap">
              {isSaving ? (
                <div className="flex items-center gap-1 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.1em] text-primary leading-none">
                  <CloudUpload className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                  <span className="animate-pulse whitespace-nowrap">{t('syncing')}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 whitespace-nowrap text-[9px] font-black uppercase tracking-[0.1em] text-muted-foreground/80 leading-none">
                  <CloudCheck className="h-3.5 w-3.5 shrink-0 text-green-500/80" />
                  <span className="whitespace-nowrap">{t('saved')}</span>
                </div>
              )}
            </div>
          )}

          {isMapPage && isMobileViewport && (
            <Dialog open={helpSheetOpen} onOpenChange={handleHelpOpenChange}>
              <Button type="button" variant="ghost" size="sm" className="h-11 w-11 px-0 rounded-full" onClick={() => handleHelpOpenChange(true)} aria-label={resolvedLocale === 'ko' ? '사용 가이드 열기' : 'Open usage guide'}>
                <CircleHelp className="h-5 w-5" />
              </Button>
              <DialogContent
                showCloseButton={false}
                className="top-auto left-0 right-0 bottom-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-4"
              >
                <DialogTitle className="sr-only">
                  {resolvedLocale === 'ko' ? '사용 가이드' : 'Usage Guide'}
                </DialogTitle>
                <HelpPanel locale={resolvedLocale} tab={helpTab} onTabChange={setHelpTab} />
              </DialogContent>
            </Dialog>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-11 w-11 px-0" aria-label={resolvedLocale === 'ko' ? '메뉴 열기' : 'Open menu'}>
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => switchLocale('en')} className={locale === 'en' ? "bg-accent" : ""}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchLocale('ko')} className={locale === 'ko' ? "bg-accent" : ""}>
                한국어
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
              <DropdownMenuSeparator />

              {user ? (
                <>
                  <DropdownMenuItem onClick={() => router.push('/')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {t('dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/map/new')}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('new_map')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    {t('sign_out')}
                  </DropdownMenuItem>
                </>
              ) : (
                <>
                  <DropdownMenuItem onClick={() => router.push('/login')}>
                    {t('sign_in')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/login')}>
                    {t('get_started')}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </header>
  );
}
