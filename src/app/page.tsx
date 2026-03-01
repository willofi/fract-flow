'use client';

import { useListMindMaps, useMindMap } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Plus, BrainCircuit, Calendar, ChevronRight, Search, Loader2, Sparkles, Clock, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useState, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

export default function Home() {
  const { data: maps, isLoading } = useListMindMaps();
  const { deleteMap } = useMindMap();
  const [search, setSearch] = useState('');

  const filteredMaps = maps?.filter(map => 
    map.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = useCallback(async (e: React.MouseEvent, id: string, title: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${title}"?`)) {
      try {
        await deleteMap.mutateAsync(id);
      } catch (err) {
        console.error("Failed to delete map:", err);
        alert("Failed to delete the map. Please try again.");
      }
    }
  }, [deleteMap]);

  return (
    <div className="min-h-full bg-background/50">
      {/* Hero / Header Area */}
      <div className="bg-background border-b">
        <div className="container mx-auto px-4 md:px-8 py-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" />
              <span>Welcome Back</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-foreground">
              Your Visual <span className="text-primary">Knowledge</span> Base
            </h1>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Organize thoughts, map complex ideas, and collaborate on your vision with our modern mind-mapping workspace.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[200px]">
            <Link href="/map/new">
              <Button size="lg" className="w-full h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg font-bold hover:scale-[1.02] transition-transform">
                <Plus className="mr-2 h-5 w-5 stroke-[3px]" />
                New Map
              </Button>
            </Link>
            <div className="flex items-center justify-center gap-4 text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span>{maps?.length || 0} Projects</span>
              <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
              <span>Unlimited Nodes</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-12 space-y-10">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search your maps..."
              className="pl-10 h-12 bg-card/50 border-border/60 rounded-xl focus-visible:ring-primary/20 focus-visible:bg-card transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex h-[400px] w-full items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
              <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Syncing workspace...</p>
            </div>
          </div>
        ) : !filteredMaps?.length ? (
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-3xl border-2 border-dashed border-border/60 bg-card/20">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center px-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/5 text-primary mb-8 animate-bounce-slow">
                <BrainCircuit className="h-12 w-12 opacity-50" />
              </div>
              <h3 className="text-2xl font-black tracking-tight mb-3">No maps found</h3>
              <p className="mb-8 text-muted-foreground leading-relaxed">
                {search ? "No maps match your search criteria. Try a different term." : "Your creative journey starts here. Create your first mind map to visualize your thoughts."}
              </p>
              {!search && (
                <Link href="/map/new">
                  <Button size="lg" className="rounded-xl px-10 h-14 font-bold">
                    <Plus className="mr-2 h-5 w-5" />
                    Create First Map
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
                  <Card className="h-full border-border/40 bg-card/40 backdrop-blur-sm rounded-3xl overflow-hidden transition-all duration-300 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1">
                    <CardHeader className="p-6 pb-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                          <BrainCircuit className="h-6 w-6" />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                            onClick={(e) => handleDelete(e, map.id, map.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
                            <ChevronRight className="h-4 w-4 text-foreground" />
                          </div>
                        </div>
                      </div>
                      <CardTitle className="text-xl font-bold tracking-tight line-clamp-1 group-hover:text-primary transition-colors">
                        {map.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-2 font-medium">
                        <Clock className="h-3 w-3" />
                        Updated {formatDistanceToNow(new Date(map.updated_at))} ago
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 py-0 h-20 relative">
                      <div className="absolute inset-x-6 top-0 h-[1px] bg-gradient-to-r from-transparent via-border/60 to-transparent" />
                      <div className="pt-4 text-xs text-muted-foreground line-clamp-2 leading-relaxed italic">
                        Open this map to view nodes and connections.
                      </div>
                    </CardContent>
                    <CardFooter className="px-6 py-6 pt-0 mt-auto">
                      <div className="flex w-full items-center justify-between">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/60 text-[10px] font-black uppercase tracking-widest text-secondary-foreground/70">
                          <Calendar className="h-2.5 w-2.5" />
                          {new Date(map.created_at).toLocaleDateString()}
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
