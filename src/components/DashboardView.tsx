'use client';

import { useListMindMaps, useMindMap } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ChevronRight, Search, Loader2, Sparkles, Clock, Trash2 } from 'lucide-react';
import { FractFlowIcon } from '@/components/icons/FractFlowIcon';
import { Link, useRouter } from '@/i18n/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS } from 'date-fns/locale';
import { useTranslations, useLocale } from 'next-intl';

export function DashboardView() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const dateLocale = locale === 'ko' ? ko : enUS;
  
  const { data: maps, isLoading } = useListMindMaps();
  const { deleteMap } = useMindMap();
  const [search, setSearch] = useState('');

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

  return (
    <div className="min-h-full bg-background/50 pb-20">
      {/* Dashboard Hero */}
      <div className="bg-background border-b relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/[0.02] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 py-16 flex flex-col md:flex-row md:items-center justify-between gap-8 relative">
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

      <div className="container mx-auto px-4 md:px-8 py-12 space-y-10">
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
                <Link href={`/map/${map.id}`} className="block h-full">
                  <Card className="h-full border-border/40 bg-card/40 backdrop-blur-md rounded-[2rem] overflow-hidden transition-all duration-500 hover:border-primary/40 hover:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:hover:shadow-primary/5 hover:-translate-y-2 group">
                    <CardHeader className="p-8 pb-4">
                      <div className="flex items-center justify-between mb-6">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500 shadow-sm">
                          <FractFlowIcon className="h-7 w-7" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-10 w-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all duration-300"
                            onClick={(e) => handleDelete(e, map.id, map.title)}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                          <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                            <ChevronRight className="h-5 w-5 text-foreground group-hover:translate-x-0.5 transition-transform" />
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-2xl font-black tracking-tight line-clamp-1 group-hover:text-primary transition-colors mb-2">
                        {map.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-muted-foreground/70">
                        <Clock className="h-3.5 w-3.5" />
                        {t('updated_ago', { time: formatDistanceToNow(new Date(map.updated_at), { locale: dateLocale }) })}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-8 py-0 h-24 relative flex items-center">
                      <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                      <p className="text-sm text-muted-foreground/80 line-clamp-2 leading-relaxed italic font-medium">
                        {t('explore_desc')}
                      </p>
                    </CardContent>
                    <CardFooter className="px-8 py-8 pt-0 mt-auto">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/80 text-[10px] font-black uppercase tracking-[0.2em] text-secondary-foreground/80 border border-border/50">
                          <Calendar className="h-3 w-3" />
                          {new Date(map.created_at).toLocaleDateString(locale)}
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
