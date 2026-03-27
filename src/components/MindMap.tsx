'use client';

import React, { useCallback, useEffect, useRef } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap,
  Panel,
  Node,
  useReactFlow,
  ReactFlowProvider,
  BackgroundVariant,
  ConnectionMode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useMindMapStore } from '@/store/useMindMapStore';
import { useMindMap, useListMindMaps } from '@/hooks/useMindMap';
import { Button } from '@/components/ui/button';
import { Save, Loader2, ArrowLeft, MousePointer2, Type, Share2, Link2, Minimize2, Pencil, Palette, Trash2, Sparkles } from 'lucide-react';
import { MarkdownNode } from './nodes/MarkdownNode';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useTheme } from 'next-themes';
import { Link } from '@/i18n/navigation';
import { useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useLocale } from 'next-intl';
import { trackUXEvent } from '@/lib/ux-events';

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
    title,
    isInitialLoad,
    onNodesChange, 
    onEdgesChange, 
    onConnect, 
    setNodes, 
    setEdges,
    setTitle,
    setIsInitialLoad,
    resetGraph,
    addNode,
    deleteNode,
    setNodeColor,
    setPendingConnection,
    pendingConnection,
    setSelectedNodeId,
    nodeActionSheetNodeId,
    setNodeActionSheetNodeId,
    setEditingNodeId,
    interactionMode,
    setInteractionMode,
    isTouchDevice,
    setIsTouchDevice,
    helpOpen,
    setHelpOpen,
    hasSeenHelpV1,
    setHasSeenHelpV1,
    version,
    setIsSaving
  } = useMindMapStore();

  const { data: mapData, save, isLoading } = useMindMap(mapId);
  const { data: allMaps } = useListMindMaps();

  // Sync mutation status with global store
  useEffect(() => {
    setIsSaving(save.isPending);
  }, [save.isPending, setIsSaving]);
  
  const locale = useLocale();
  const { theme } = useTheme();
  const { project, fitView } = useReactFlow();
  const router = useRouter();
  
  const lastSavedVersion = useRef(version);
  const lastSavedTitle = useRef(title);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedMapIdRef = useRef<string | undefined>(undefined);
  const paneLongPressTimerRef = useRef<number | null>(null);
  const paneLongPressPointRef = useRef<{ x: number; y: number } | null>(null);

  const clearPaneLongPress = useCallback(() => {
    if (paneLongPressTimerRef.current !== null) {
      window.clearTimeout(paneLongPressTimerRef.current);
      paneLongPressTimerRef.current = null;
    }
    paneLongPressPointRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearPaneLongPress();
  }, [clearPaneLongPress]);

  useEffect(() => {
    const media = window.matchMedia('(hover: none), (pointer: coarse)');
    const updateTouchMode = () => setIsTouchDevice(media.matches);
    updateTouchMode();
    media.addEventListener('change', updateTouchMode);
    return () => media.removeEventListener('change', updateTouchMode);
  }, [setIsTouchDevice]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem('ff_help_v1_seen') === 'true';
    setHasSeenHelpV1(seen);
    if (!seen) {
      setHelpOpen(true);
      trackUXEvent('help_tour_started', { surface: isTouchDevice ? 'mobile' : 'desktop' });
    }
  }, [setHasSeenHelpV1, setHelpOpen, isTouchDevice]);

  // RESET LOGIC: When mapId changes, force a fresh start
  useEffect(() => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    loadedMapIdRef.current = undefined;
    lastSavedVersion.current = 0;
    lastSavedTitle.current = 'Loading...';
    resetGraph(); // Clear stale graph state atomically
  }, [mapId, resetGraph]);

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
      setTitle(mapData.title);
      loadedMapIdRef.current = mapId;
      lastSavedVersion.current = version;
      lastSavedTitle.current = mapData.title;
      setIsInitialLoad(false);
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
      setTitle(nextTitle);
      loadedMapIdRef.current = undefined;
      lastSavedVersion.current = version;
      lastSavedTitle.current = nextTitle;
      setIsInitialLoad(false);
      setTimeout(() => fitView({ padding: 0.8 }), 100);
    }
  }, [mapData, mapId, isLoading, allMaps, setNodes, setEdges, setTitle, setIsInitialLoad, fitView, version, isInitialLoad]);

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

  const createNodeAtClientPoint = useCallback((clientX: number, clientY: number, source: string) => {
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'markdown',
      data: { label: 'New Idea' },
      position: project({ x: clientX, y: clientY - 60 }),
    };
    addNode(newNode);
    setSelectedNodeId(newNode.id);
    trackUXEvent('node_created', { source, touch: isTouchDevice });
  }, [addNode, project, setSelectedNodeId, isTouchDevice]);

  const onAddNode = useCallback(() => {
    createNodeAtClientPoint(window.innerWidth / 2 - 100, window.innerHeight / 2 - 100, 'toolbar');
  }, [createNodeAtClientPoint]);

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href);
  }, []);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (isTouchDevice) return;
    createNodeAtClientPoint(event.clientX, event.clientY, 'desktop-contextmenu');
  }, [createNodeAtClientPoint, isTouchDevice]);

  const onPaneClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const resolvePoint = () => {
      if ('clientX' in event) return { x: event.clientX, y: event.clientY };
      const touch = event.touches[0] ?? event.changedTouches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    };

    if (interactionMode === 'add') {
      const point = resolvePoint();
      if (point) {
        createNodeAtClientPoint(point.x, point.y, 'mode-add');
      }
      return;
    }

    if (interactionMode === 'connect' && pendingConnection) {
      setPendingConnection(null);
      trackUXEvent('mis_tap_connect_cancelled', { source: 'pane-click' });
    }

    setSelectedNodeId(null);
    setNodeActionSheetNodeId(null);
  }, [interactionMode, pendingConnection, setPendingConnection, setSelectedNodeId, setNodeActionSheetNodeId, createNodeAtClientPoint]);

  const onPanePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchDevice || event.pointerType !== 'touch') return;
    const target = event.target as HTMLElement;
    if (!target.closest('.react-flow__pane') || target.closest('.react-flow__node')) return;

    clearPaneLongPress();
    paneLongPressPointRef.current = { x: event.clientX, y: event.clientY };
    paneLongPressTimerRef.current = window.setTimeout(() => {
      if (!paneLongPressPointRef.current) return;
      createNodeAtClientPoint(paneLongPressPointRef.current.x, paneLongPressPointRef.current.y, 'longpress-canvas');
      clearPaneLongPress();
    }, 350);
  }, [isTouchDevice, clearPaneLongPress, createNodeAtClientPoint]);

  const onPanePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!paneLongPressPointRef.current) return;
    const dx = Math.abs(event.clientX - paneLongPressPointRef.current.x);
    const dy = Math.abs(event.clientY - paneLongPressPointRef.current.y);
    if (dx > 10 || dy > 10) clearPaneLongPress();
  }, [clearPaneLongPress]);

  useEffect(() => {
    if (interactionMode !== 'connect' && pendingConnection) {
      setPendingConnection(null);
    }
  }, [interactionMode, pendingConnection, setPendingConnection]);

  const completeCoachmarks = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ff_help_v1_seen', 'true');
    }
    setHasSeenHelpV1(true);
    setHelpOpen(false);
    trackUXEvent('help_tour_completed', { surface: isTouchDevice ? 'mobile' : 'desktop' });
  }, [setHasSeenHelpV1, setHelpOpen, isTouchDevice]);

  const isMapReady = !isLoading || !isInitialLoad;
  const actionSheetNode = nodeActionSheetNodeId ? nodes.find((node) => node.id === nodeActionSheetNodeId) : null;
  const uiText = locale === 'ko'
    ? {
        modeSelect: '선택',
        modeAdd: '추가',
        modeConnect: '연결',
        modeResize: '크기',
        actionTitle: '노드 작업',
        actionEdit: '편집',
        actionConnect: '연결 시작',
        actionDelete: '삭제',
        actionColor: '색상',
        coachTitle: '모바일 빠른 가이드',
        coach1: '모드바에서 추가/연결/크기 모드를 전환하세요.',
        coach2: '캔버스를 350ms 길게 누르면 노드를 바로 만들 수 있어요.',
        coach3: '노드를 길게 누르면 편집/색상/삭제 액션시트를 엽니다.',
        coachDone: '확인',
        connectHintStart: '연결: 소스 노드를 선택하세요.',
        connectHintTarget: '연결: 타깃 노드를 선택하세요.',
      }
    : {
        modeSelect: 'Select',
        modeAdd: 'Add',
        modeConnect: 'Connect',
        modeResize: 'Resize',
        actionTitle: 'Node Actions',
        actionEdit: 'Edit',
        actionConnect: 'Start Connect',
        actionDelete: 'Delete',
        actionColor: 'Color',
        coachTitle: 'Mobile Quick Guide',
        coach1: 'Use mode bar for add/connect/resize.',
        coach2: 'Long-press canvas for 350ms to create a node quickly.',
        coach3: 'Long-press a node to open edit/color/delete actions.',
        coachDone: 'Got it',
        connectHintStart: 'Connect: choose a source node.',
        connectHintTarget: 'Connect: choose a target node.',
      };

  if (isLoading && isInitialLoad) {
    return (
      <div className="flex h-[calc(100vh-4rem)] w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div
      className="h-[calc(100vh-4rem)] w-full bg-background relative overflow-hidden"
      onPointerDown={onPanePointerDown}
      onPointerMove={onPanePointerMove}
      onPointerUp={clearPaneLongPress}
      onPointerCancel={clearPaneLongPress}
    >
      <ReactFlow
        key={mapId ?? 'new'}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onSelectionChange={({ nodes: selectedNodes }) => {
          setSelectedNodeId(selectedNodes[0]?.id ?? null);
        }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.8 }}
        nodesDraggable={!isTouchDevice || interactionMode === 'select'}
        nodesConnectable={!isTouchDevice || interactionMode === 'connect'}
        snapToGrid
        snapGrid={[20, 20]}
        zoomOnPinch
        zoomOnScroll={!isTouchDevice}
        zoomOnDoubleClick={!isTouchDevice}
        panOnDrag={!isTouchDevice}
        className={cn("bg-background", theme === 'dark' ? 'dark' : '')}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={25} size={1} color={theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} />
        <Controls showInteractive={false} showZoom={!isTouchDevice} />
        {!isTouchDevice && (
          <MiniMap 
            nodeColor={(node) => (node.data.color as string) || (theme === 'dark' ? '#333' : '#eee')}
            nodeStrokeColor={(node) => node.selected ? 'var(--primary)' : 'transparent'}
            nodeStrokeWidth={3}
            maskColor={theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
          />
        )}
        <Panel position="top-left" className={cn(isTouchDevice ? "m-2.5" : "m-4")}>
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className={cn("rounded-full hover:bg-accent/20 transition-all group active:scale-95", isTouchDevice ? "h-9 w-9" : "h-10 w-10")}>
                <ArrowLeft className={cn("transition-transform group-hover:-translate-x-1", isTouchDevice ? "h-5 w-5" : "h-6 w-6")} />
              </Button>
            </Link>
            <Input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className={cn(
                "h-10 border-none bg-transparent font-bold focus-visible:ring-0 px-2 placeholder:text-muted-foreground/30",
                isTouchDevice ? "w-[min(48vw,220px)] text-sm" : "w-64 text-xl"
              )}
              placeholder="Untitled Map" 
              disabled={!isMapReady}
            />
          </div>
        </Panel>
        <Panel position="top-right" className={cn("flex", isTouchDevice ? "m-3 gap-2" : "m-6 gap-3")}>
          <Card className="flex p-1 gap-0.5 bg-card/80 backdrop-blur-xl border-border/40 shadow-xl rounded-xl items-center">
            {!isTouchDevice && (
              <>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Reset View" onClick={() => fitView({ duration: 800, padding: 0.8 })}><MousePointer2 className="h-4 w-4" /></Button>
                <Button onClick={onAddNode} variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-primary hover:bg-primary/10" title="Add Node"><Type className="h-4 w-4 stroke-[2.5px]" /></Button>
                <div className="w-[1px] h-2 bg-border/60 mx-1" />
              </>
            )}
            <Button onClick={onShare} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Copy URL"><Share2 className="h-4 w-4" /></Button>
            <div className="w-[1px] h-2 bg-border/60 mx-1" />
            <Button onClick={() => save.mutate({ nodes, edges, title, targetMapId: mapId })} disabled={save.isPending || !isMapReady} variant="ghost" size="icon" className="h-9 w-9 rounded-lg hover:bg-accent/50" title="Manual Save">{save.isPending ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Save className="h-4 w-4" />}</Button>
          </Card>
        </Panel>

        {isTouchDevice && interactionMode === 'connect' && (
          <Panel position="top-center" className="mt-3">
            <Card className="border-primary/20 bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur">
              {pendingConnection ? uiText.connectHintTarget : uiText.connectHintStart}
            </Card>
          </Panel>
        )}

        {isTouchDevice && (
          <Panel position="bottom-right" className="mr-4 mb-4 pointer-events-auto !flex-row">
            <Card className="flex flex-row flex-nowrap items-center gap-1 rounded-2xl border-border/40 bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl">
              <Button variant={interactionMode === 'select' ? 'secondary' : 'ghost'} size="sm" className="h-9 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('select')}>
                <MousePointer2 className="h-3.5 w-3.5" />
                {uiText.modeSelect}
              </Button>
              <Button variant={interactionMode === 'add' ? 'secondary' : 'ghost'} size="sm" className="h-9 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('add')}>
                <Type className="h-3.5 w-3.5" />
                {uiText.modeAdd}
              </Button>
              <Button variant={interactionMode === 'connect' ? 'secondary' : 'ghost'} size="sm" className="h-9 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('connect')}>
                <Link2 className="h-3.5 w-3.5" />
                {uiText.modeConnect}
              </Button>
              <Button variant={interactionMode === 'resize' ? 'secondary' : 'ghost'} size="sm" className="h-9 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('resize')}>
                <Minimize2 className="h-3.5 w-3.5" />
                {uiText.modeResize}
              </Button>
            </Card>
          </Panel>
        )}
      </ReactFlow>

      <Dialog
        open={Boolean(actionSheetNode)}
        onOpenChange={(next) => {
          if (!next) setNodeActionSheetNodeId(null);
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="top-auto left-0 right-0 bottom-0 w-full max-w-none translate-x-0 translate-y-0 rounded-t-2xl rounded-b-none border-x-0 border-b-0 p-4"
        >
          <DialogTitle className="sr-only">{uiText.actionTitle}</DialogTitle>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold">{uiText.actionTitle}</h3>
              <span className="max-w-[58vw] truncate text-xs text-muted-foreground">
                {(actionSheetNode?.data.label as string) ?? ''}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => {
                  if (!actionSheetNode) return;
                  setEditingNodeId(actionSheetNode.id);
                  setNodeActionSheetNodeId(null);
                }}
              >
                <Pencil className="h-4 w-4" />
                {uiText.actionEdit}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10"
                onClick={() => {
                  if (!actionSheetNode) return;
                  setInteractionMode('connect');
                  setSelectedNodeId(actionSheetNode.id);
                  setPendingConnection(null);
                  setNodeActionSheetNodeId(null);
                  trackUXEvent('connect_started', { source: 'action-sheet' });
                }}
              >
                <Link2 className="h-4 w-4" />
                {uiText.actionConnect}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="h-10"
                onClick={() => {
                  if (!actionSheetNode) return;
                  deleteNode(actionSheetNode.id);
                  setNodeActionSheetNodeId(null);
                }}
              >
                <Trash2 className="h-4 w-4" />
                {uiText.actionDelete}
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">{uiText.actionColor}</p>
              <div className="grid grid-cols-8 gap-2">
                {[
                  { name: 'Default', value: 'var(--card)' },
                  { name: 'Blue', value: 'var(--node-blue)' },
                  { name: 'Green', value: 'var(--node-green)' },
                  { name: 'Yellow', value: 'var(--node-yellow)' },
                  { name: 'Orange', value: 'var(--node-orange)' },
                  { name: 'Red', value: 'var(--node-red)' },
                  { name: 'Purple', value: 'var(--node-purple)' },
                  { name: 'Pink', value: 'var(--node-pink)' },
                ].map((color) => (
                  <Button
                    key={color.name}
                    type="button"
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-full p-0"
                    style={{ backgroundColor: color.value }}
                    aria-label={`${uiText.actionColor}: ${color.name}`}
                    onClick={() => {
                      if (!actionSheetNode) return;
                      setNodeColor(actionSheetNode.id, color.value);
                    }}
                  >
                    <Palette className="h-0 w-0 opacity-0" />
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {isTouchDevice && helpOpen && !hasSeenHelpV1 && (
        <div className="absolute inset-0 z-[80] bg-background/70 backdrop-blur-[1px] p-4">
          <div className="mx-auto mt-20 max-w-sm rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <h3 className="text-sm font-bold">{uiText.coachTitle}</h3>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>{uiText.coach1}</p>
              <p>{uiText.coach2}</p>
              <p>{uiText.coach3}</p>
            </div>
            <div className="mt-4 flex justify-end">
              <Button size="sm" onClick={completeCoachmarks}>{uiText.coachDone}</Button>
            </div>
          </div>
        </div>
      )}
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
