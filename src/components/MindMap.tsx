'use client';

import React, { useCallback, useEffect, useState, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Panel,
  Node,
  Edge,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMindMapStore } from '@/store/useMindMapStore';
import { useMindMap, useListMindMaps } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Save, Plus, Loader2, ArrowLeft, MousePointer2, Type, Share2, Check, CloudCheck, CloudUpload } from 'lucide-react';
import { MarkdownNode } from './nodes/MarkdownNode';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

const nodeTypes = {
  markdown: MarkdownNode,
};

const defaultEdgeOptions = {
  animated: false,
  style: { strokeWidth: 1.2 },
  type: 'default',
};

function cloneGraph<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function MindMapContent({ mapId }: { mapId?: string }) {
  const { 
    nodes, 
    edges, 
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setNodes, 
    setEdges,
    addNode,
    setPendingConnection,
    version,
    setIsSaving
  } = useMindMapStore();

  const { data: mapData, save, isLoading } = useMindMap(mapId);
  const { data: allMaps } = useListMindMaps();

  // Sync mutation status with global store
  useEffect(() => {
    setIsSaving(save.isPending);
  }, [save.isPending, setIsSaving]);
  
  const [title, setTitle] = useState('New Mind Map');
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const { project, fitView } = useReactFlow();
  const router = useRouter();
  
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastSavedVersion = useRef(version);
  const lastSavedTitle = useRef(title);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedMapIdRef = useRef<string | undefined>(undefined);

  // RESET LOGIC: When mapId changes, force a fresh start
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    queueMicrotask(() => setIsInitialLoad(true));
    loadedMapIdRef.current = undefined;
    lastSavedVersion.current = version;
    lastSavedTitle.current = 'Loading...';
    setPendingConnection(null);
    queueMicrotask(() => setTitle('Loading...')); // Visual reset
    setNodes([]); // Clear stale nodes
    setEdges([]); // Clear stale edges
  }, [mapId, setPendingConnection, setNodes, setEdges, version]);

  // AUTO-SAVE LOGIC: Only trigger if structural version or title actually changed
  useEffect(() => {
    if (isInitialLoad) return;
    if (mapId && loadedMapIdRef.current !== mapId) return;

    // Check if anything meaningful changed since last save
    if (version === lastSavedVersion.current && title === lastSavedTitle.current) {
      return;
    }

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(() => {
      if (nodes.length > 0) {
        save.mutate({ nodes, edges, title, targetMapId: mapId }, {
          onSuccess: (data) => {
            lastSavedVersion.current = version;
            lastSavedTitle.current = title;
            if (!mapId && data.id) {
              router.replace(`/map/${data.id}`);
            }
          }
        });
      }
    }, 1200); // Slightly longer debounce for calmness

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [version, title, mapId, router, save, nodes, edges, isInitialLoad]);

  // INITIAL DATA LOADING
  useEffect(() => {
    if (!isInitialLoad) return;

    if (mapData && mapId) {
      // Ensure the loaded data matches the current mapId
      if (mapData.id !== mapId) return;

      setNodes(cloneGraph(mapData.nodes || []));
      setEdges(cloneGraph(mapData.edges || []));
      queueMicrotask(() => setTitle(mapData.title));
      loadedMapIdRef.current = mapId;
      lastSavedVersion.current = version;
      lastSavedTitle.current = mapData.title;
      queueMicrotask(() => setIsInitialLoad(false));
      setTimeout(() => fitView({ padding: 0.8 }), 100);
    } else if (!mapId && !isLoading && allMaps !== undefined) {
      // New map initialization
      const baseName = "New Mind Map";
      let nextTitle = baseName;
      const existingTitles = allMaps?.map(m => m.title) || [];
      if (existingTitles.includes(baseName)) {
        let counter = 2;
        while (existingTitles.includes(`${baseName} ${counter}`)) {
          counter++;
        }
        nextTitle = `${baseName} ${counter}`;
      }

      setNodes([{ id: 'root', type: 'markdown', data: { label: '# Start Here' }, position: { x: 0, y: 0 } }]);
      setEdges([]);
      queueMicrotask(() => setTitle(nextTitle));
      loadedMapIdRef.current = undefined;
      lastSavedVersion.current = version;
      lastSavedTitle.current = nextTitle;
      queueMicrotask(() => setIsInitialLoad(false));
      setTimeout(() => fitView({ padding: 0.8 }), 100);
    }
  }, [mapData, mapId, isLoading, allMaps, setNodes, setEdges, fitView, version, isInitialLoad]);

  // AUTO-ROUTING
  useEffect(() => {
    if (nodes.length < 2 || edges.length === 0) return;
    const updatedEdges = edges.map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const targetNode = nodes.find((n) => n.id === edge.target);
      if (!sourceNode || !targetNode) return edge;
      const dx = targetNode.position.x - sourceNode.position.x;
      const dy = targetNode.position.y - sourceNode.position.y;
      let sourceHandle = 'b';
      let targetHandle = 't';
      if (Math.abs(dx) > Math.abs(dy)) {
        sourceHandle = dx > 0 ? 'r' : 'l';
        targetHandle = dx > 0 ? 'l' : 'r';
      } else {
        sourceHandle = dy > 0 ? 'b' : 't';
        targetHandle = dy > 0 ? 't' : 'b';
      }
      if (edge.sourceHandle !== sourceHandle || edge.targetHandle !== targetHandle) {
        return { ...edge, sourceHandle, targetHandle };
      }
      return edge;
    });
    const hasChanged = updatedEdges.some((edge, index) => edge.sourceHandle !== edges[index].sourceHandle || edge.targetHandle !== edges[index].targetHandle);
    if (hasChanged) setEdges(updatedEdges);
  }, [nodes, edges, setEdges]);

  const onAddNode = useCallback(() => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'markdown',
      data: { label: 'New Idea' },
      position: project({ x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 }),
    };
    addNode(newNode);
  }, [addNode, project]);

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'markdown',
      data: { label: 'New Idea' },
      position: project({ x: event.clientX, y: event.clientY - 60 }),
    };
    addNode(newNode);
  }, [addNode, project]);

  const isMapReady = !isLoading || !isInitialLoad;

  if (isLoading && isInitialLoad) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] w-full bg-background relative overflow-hidden">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={() => setPendingConnection(null)}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.8 }}
        snapToGrid
        snapGrid={[20, 20]}
        className={cn("bg-background", theme === 'dark' ? 'dark' : '')}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={25} size={1} color={theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} />
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={(node) => (node.data.color as string) || (theme === 'dark' ? '#333' : '#eee')}
          nodeStrokeColor={(node) => node.selected ? 'var(--primary)' : 'transparent'}
          nodeStrokeWidth={3}
          maskColor={theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
        />
        <Panel position="top-left" className="m-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-accent/20 transition-all group active:scale-95">
                <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
              </Button>
            </Link>
            <Input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="h-10 w-64 border-none bg-transparent text-xl font-bold focus-visible:ring-0 px-2 placeholder:text-muted-foreground/30" 
              placeholder="Untitled Map" 
              disabled={!isMapReady}
            />
          </div>
        </Panel>
        <Panel position="top-right" className="m-6 flex gap-3">
          <Card className="flex p-1 gap-0.5 bg-card/80 backdrop-blur-xl border-border/40 shadow-xl rounded-xl items-center">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Reset View" onClick={() => fitView({ duration: 800, padding: 0.8 })}><MousePointer2 className="h-4 w-4" /></Button>
            <Button onClick={onAddNode} variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/10" title="Add Node"><Type className="h-4 w-4 stroke-[2.5px]" /></Button>
            <div className="w-[1px] h-2 bg-border/60 mx-1" />
            <Button onClick={onShare} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Copy URL"><Share2 className="h-4 w-4" /></Button>
            <div className="w-[1px] h-2 bg-border/60 mx-1" />
            <Button onClick={() => save.mutate({ nodes, edges, title, targetMapId: mapId })} disabled={save.isPending || !isMapReady} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Manual Save">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Save className="h-4 w-4" />}</Button>
          </Card>
        </Panel>
        <Panel position="bottom-center" className="mb-6 pointer-events-none">
          <div className="bg-card/40 backdrop-blur-sm px-5 py-1.5 rounded-full border border-border/20 text-[8px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 flex gap-5">
            <span>Right-click node for colors</span><span className="w-1 h-1 rounded-full bg-primary/20 self-center" /><span>Right-click canvas to add</span><span className="w-1 h-1 rounded-full bg-primary/20 self-center" /><span>Double-click to edit</span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}

export default function MindMap(props: { mapId?: string }) {
  return (
    <ReactFlowProvider>
      <MindMapContent {...props} />
    </ReactFlowProvider>
  );
}
