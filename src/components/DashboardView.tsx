'use client';

import { useListMindMaps, useMindMap } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ChevronRight, Search, Loader2, Sparkles, Clock, Trash2 } from 'lucide-react';
import { FractFlowIcon } from '@/components/icons/FractFlowIcon';
import { Link } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useCallback, useRef } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

const SWIPE_REVEAL_WIDTH = 92;
const SWIPE_ACTIVATE_DISTANCE = 12;
const SWIPE_DIRECTION_RATIO = 1.2;

export function DashboardView() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const dateLocale = locale === 'ko' ? ko : enUS;
  
  const { data: maps, isLoading } = useListMindMaps();
  const { deleteMap } = useMindMap();
  const [search, setSearch] = useState('');
  const [openSwipeId, setOpenSwipeId] = useState<string | null>(null);
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeGestureRef = useRef<{ id: string; startX: number; startY: number; lock: 'x' | 'y' | null; baseOffset: number } | null>(null);
  const deleteLabel = locale === 'ko' ? '삭제' : 'Delete';

  const filteredMaps = maps?.filter(map => 
    map.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(t('delete_confirm', { title }))) {
      try {
        await deleteMap.mutateAsync(id);
      } catch (err) {
        console.error("Failed to delete map:", err);
        alert(t('delete_failed'));
      }
    }
  }, [deleteMap, t]);

  const handleTouchStart = useCallback((id: string, e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const baseOffset = openSwipeId === id ? -SWIPE_REVEAL_WIDTH : 0;
    swipeGestureRef.current = {
      id,
      startX: touch.clientX,
      startY: touch.clientY,
      lock: null,
      baseOffset,
    };
    setSwipingId(id);
    setSwipeOffset(baseOffset);
  }, [openSwipeId]);

  const handleTouchMove = useCallback((id: string, e: React.TouchEvent) => {
    if (!swipeGestureRef.current || swipeGestureRef.current.id !== id) return;
    const touch = e.touches[0];
    if (!touch) return;
    const gesture = swipeGestureRef.current;
    const deltaX = touch.clientX - gesture.startX;
    const deltaY = touch.clientY - gesture.startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (!gesture.lock) {
      if (absX > SWIPE_ACTIVATE_DISTANCE && absX > absY * SWIPE_DIRECTION_RATIO) {
        gesture.lock = 'x';
      } else if (absY > SWIPE_ACTIVATE_DISTANCE && absY > absX * SWIPE_DIRECTION_RATIO) {
        gesture.lock = 'y';
      } else {
        return;
      }
    }

    if (gesture.lock !== 'x') return;
    const next = Math.min(0, Math.max(-SWIPE_REVEAL_WIDTH, gesture.baseOffset + deltaX));
    setSwipeOffset(next);
  }, []);

  const handleTouchEnd = useCallback((id: string) => {
    const gesture = swipeGestureRef.current;
    if (gesture && gesture.id === id && gesture.lock === 'x') {
      const finalOffset = swipingId === id ? swipeOffset : gesture.baseOffset;
      const shouldOpen = finalOffset <= -SWIPE_REVEAL_WIDTH / 2;
      setOpenSwipeId(shouldOpen ? id : null);
    }
    setSwipingId(null);
    setSwipeOffset(0);
    swipeGestureRef.current = null;
  }, [swipeOffset, swipingId]);

  return (
    <div className="min-h-full bg-background/50 pb-20">
      {/* Dashboard Hero */}
      <div className="bg-background border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8 py-16 flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
              <Sparkles className="h-3 w-3" />
              <span>{t('workspace')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              {t.rich('title', {
                knowledge: (chunks) => <span className="text-primary italic">{chunks}</span>
              })}
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed font-medium">
              {t('description')}
            </p>
          </div>
          <div className="flex flex-col gap-4 min-w-[240px]">
            <Link href="/map/new">
              <Button size="lg" className="w-full h-16 rounded-2xl shadow-xl shadow-primary/20 text-xl font-black hover:scale-[1.02] transition-transform">
                <Plus className="mr-2 h-6 w-6 stroke-[3px]" />
                {t('new_flow')}
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
              <span>{t('projects', { count: maps?.length || 0 })}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-primary/30" />
              <span>{t('unlimited')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-8 py-12 space-y-10">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder={t('search')}
              className="pl-12 h-14 bg-card/50 border-border/60 rounded-2xl focus-visible:ring-primary/20 focus-visible:bg-card transition-all text-lg"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex h-[400px] w-full items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border/60 bg-card/20">
            <div className="flex flex-col items-center gap-6">
              <Loader2 className="h-12 w-12 animate-spin text-primary/40" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-muted-foreground">{t('loading')}</p>
            </div>
          </div>
        ) : !filteredMaps?.length ? (
          <div className="flex h-[500px] shrink-0 items-center justify-center rounded-[2.5rem] border-2 border-dashed border-border/60 bg-card/20">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center px-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] bg-primary/5 text-primary mb-8 border border-primary/10 shadow-inner">
                <FractFlowIcon className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-3xl font-black tracking-tight mb-4">{t('no_maps')}</h3>
              <p className="mb-10 text-muted-foreground text-lg leading-relaxed font-medium">
                {search ? t('no_maps_desc') : t('no_maps_desc')}
              </p>
              {!search && (
                <Link href="/map/new">
                  <Button size="lg" className="rounded-2xl px-12 h-16 text-lg font-black shadow-lg">
                    <Plus className="mr-2 h-6 w-6 stroke-[3px]" />
                    {t('create_first')}
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMaps.map((map) => (
              <div key={map.id} className="relative group">
                {(() => {
                  const currentOffset = swipingId === map.id
                    ? swipeOffset
                    : openSwipeId === map.id
                      ? -SWIPE_REVEAL_WIDTH
                      : 0;
                  const isRevealActive = currentOffset < -4;
                  return (
                    <>
                <button
                  type="button"
                  className="absolute inset-y-1 right-0 z-0 flex w-[94px] items-center justify-center rounded-[1.6rem] border border-red-400/20 bg-red-500/12 text-red-700 dark:text-red-200 md:hidden"
                  style={{
                    opacity: isRevealActive ? 1 : 0,
                    pointerEvents: isRevealActive ? 'auto' : 'none',
                    transition: 'opacity 140ms ease',
                  }}
                  onClick={(e) => handleDelete(e, map.id, map.title)}
                >
                  <span className="flex flex-col items-center gap-1 text-[11px] font-black uppercase tracking-wider">
                    <Trash2 className="h-4 w-4" />
                    {deleteLabel}
                  </span>
                </button>

                <div
                  className="relative z-10 transition-transform duration-200 md:transform-none"
                  style={{
                    transform: `translateX(${currentOffset}px)`,
                  }}
                  onTouchStart={(e) => handleTouchStart(map.id, e)}
                  onTouchMove={(e) => handleTouchMove(map.id, e)}
                  onTouchEnd={() => handleTouchEnd(map.id)}
                  onTouchCancel={() => handleTouchEnd(map.id)}
                >
                <Link
                  href={`/map/${map.id}`}
                  className="block h-full"
                  onClick={(e) => {
                    if (openSwipeId === map.id) {
                      e.preventDefault();
                      setOpenSwipeId(null);
                    }
                  }}
                >
                  <Card className="h-full border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden shadow-[0_14px_24px_-20px_rgba(15,23,42,0.75)] transition-all duration-500 hover:border-primary/40 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:hover:shadow-primary/5 hover:-translate-y-2 group">
                    <CardHeader className="p-4 pb-2 md:p-8 md:pb-4">
                      <div className="mb-3 flex items-center justify-between md:mb-6">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm md:h-14 md:w-14 md:rounded-2xl">
                          <FractFlowIcon className="h-5 w-5 md:h-7 md:w-7" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hidden md:inline-flex h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300"
                              onClick={(e) => handleDelete(e, map.id, map.title)}
                            >
                              <Trash2 className="h-5 w-5" />
                            </Button>
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/20 md:h-10 md:w-10">
                            <ChevronRight className="h-4 w-4 text-foreground transition-transform group-hover:translate-x-0.5 md:h-5 md:w-5" />
                          </div>
                        </div>
                      </div>
                      <CardTitle className="mb-1 line-clamp-1 text-lg font-black tracking-tight transition-colors group-hover:text-primary md:mb-2 md:text-2xl">
                        {map.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 md:gap-2 md:text-xs">
                        <Clock className="h-3 w-3 md:h-3.5 md:w-3.5" />
                        {t('updated_ago', { time: formatDistanceToNow(new Date(map.updated_at), { locale: dateLocale }) })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="relative flex h-12 items-center px-4 py-0 md:h-24 md:px-8">
                      <div className="absolute inset-x-4 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent md:inset-x-8" />
                      <p className="line-clamp-2 text-xs font-medium italic leading-relaxed text-muted-foreground/80 md:text-sm">
                        {t('explore_desc')}
                      </p>
                    </CardContent>
                    <CardFooter className="mt-auto px-4 py-4 pt-0 md:px-8 md:py-8">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5 rounded-full border border-border/50 bg-secondary/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-secondary-foreground/80 md:gap-2 md:px-3 md:py-1.5 md:text-[10px] md:tracking-[0.2em]">
                          <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                          {format(new Date(map.updated_at), 'yyyy.MM.dd HH:mm')}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
                </div>
                    </>
                  );
                })()}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
