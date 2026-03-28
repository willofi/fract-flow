'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, { 
  Background, 
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
import { Save, Loader2, ArrowLeft, MousePointer2, Type, Share2, Link2, Minimize2, Pencil, Palette, Trash2, Sparkles, Scan } from 'lucide-react';
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
import { toast } from 'sonner';

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
    selectedNodeId,
    setSelectedNodeId,
    nodeActionSheetNodeId,
    setNodeActionSheetNodeId,
    setEditingNodeId,
    isNodeEditorOpen,
    interactionMode,
    setInteractionMode,
    isTouchDevice,
    setIsTouchDevice,
    helpSheetOpen,
    setHelpSheetOpen,
    hasSeenHelpV1,
    setHasSeenHelpV1,
    version,
    setIsSaving,
    setAccessControl
  } = useMindMapStore();

  const { data: mapData, save, isLoading, accessRole, canEdit, canDelete, canShare } = useMindMap(mapId);
  const { data: allMaps } = useListMindMaps();

  // Sync mutation status with global store
  useEffect(() => {
    setIsSaving(save.isPending);
  }, [save.isPending, setIsSaving]);
  
  const locale = useLocale();
  const { theme } = useTheme();
  const { project, fitView, zoomIn, zoomOut, getNode, setCenter } = useReactFlow();
  const router = useRouter();
  const [isNarrowViewport, setIsNarrowViewport] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(max-width: 767px)').matches;
  });
  const [coachmarkOpen, setCoachmarkOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const seen = window.localStorage.getItem('ff_help_v1_seen') === 'true';
    const coarsePointer = window.matchMedia('(hover: none), (pointer: coarse)').matches;
    return coarsePointer && !seen;
  });
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  
  const lastSavedVersion = useRef(version);
  const lastSavedTitle = useRef(title);
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadedMapIdRef = useRef<string | undefined>(undefined);
  const paneLongPressTimerRef = useRef<number | null>(null);
  const paneLongPressPointRef = useRef<{ x: number; y: number } | null>(null);
  const panePanSessionRef = useRef<{ startX: number; startY: number; panStarted: boolean } | null>(null);
  const viewerViewedTrackedRef = useRef<string | null>(null);

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
    const media = window.matchMedia('(max-width: 767px)');
    const syncViewport = () => setIsNarrowViewport(media.matches);
    syncViewport();
    media.addEventListener('change', syncViewport);
    return () => media.removeEventListener('change', syncViewport);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem('ff_help_v1_seen') === 'true';
    setHasSeenHelpV1(seen);
    if (isTouchDevice && coachmarkOpen && !seen) {
      trackUXEvent('coachmark_opened', { surface: isTouchDevice ? 'mobile' : 'desktop' });
      trackUXEvent('help_tour_started', { surface: isTouchDevice ? 'mobile' : 'desktop' });
    }
  }, [setHasSeenHelpV1, isTouchDevice, coachmarkOpen]);

  useEffect(() => {
    setAccessControl({ accessRole, canEdit, canDelete, canShare });
  }, [accessRole, canEdit, canDelete, canShare, setAccessControl]);

  useEffect(() => {
    if (!mapId || isLoading || !mapData) return;
    if (accessRole !== 'viewer') return;
    if (viewerViewedTrackedRef.current === mapId) return;
    viewerViewedTrackedRef.current = mapId;
    trackUXEvent('map_viewed_as_viewer', { mapId, auth: canShare ? 'allowed' : 'unknown' });
  }, [mapId, isLoading, mapData, accessRole, canShare]);

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
    if (!canEdit) return;
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
  }, [canEdit, version, title, mapId, router, save, nodes, edges, isInitialLoad]);

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

  const readOnlyMessage = locale === 'ko' ? '읽기 전용 맵입니다. 소유자만 수정할 수 있습니다.' : 'This map is read-only. Only the owner can edit.';

  const handlePermissionDenied = useCallback((context: 'edit' | 'delete') => {
    toast.error(readOnlyMessage, { id: 'permission-denied-edit' });
    if (context === 'edit') {
      trackUXEvent('edit_blocked_not_owner', { source: 'read-only-guard' });
      return;
    }
    trackUXEvent('delete_blocked_not_owner', { source: 'read-only-guard' });
  }, [readOnlyMessage]);

  const createNodeAtClientPoint = useCallback((clientX: number, clientY: number, source: string) => {
    if (!canEdit) {
      handlePermissionDenied('edit');
      return;
    }
    const newNode: Node = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'markdown',
      data: { label: 'New Idea' },
      position: project({ x: clientX, y: clientY - 60 }),
    };
    addNode(newNode);
    setSelectedNodeId(newNode.id);
    trackUXEvent('node_created', { source, touch: isTouchDevice });
  }, [canEdit, handlePermissionDenied, addNode, project, setSelectedNodeId, isTouchDevice]);

  const onFitViewport = useCallback(() => {
    const selectedInternalNode = selectedNodeId ? getNode(selectedNodeId) : undefined;
    if (selectedInternalNode) {
      const width = selectedInternalNode.width ?? selectedInternalNode.measured?.width ?? 160;
      const height = selectedInternalNode.height ?? selectedInternalNode.measured?.height ?? 100;
      const absolute = selectedInternalNode.positionAbsolute ?? selectedInternalNode.position;
      const centerX = absolute.x + width / 2;
      const centerY = absolute.y + height / 2;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 64 : 700;
      const zoomX = (viewportWidth * 0.5) / width;
      const zoomY = (viewportHeight * 0.5) / height;
      const targetZoom = Math.max(0.6, Math.min(1.8, zoomX, zoomY));

      setCenter(centerX, centerY, { zoom: targetZoom, duration: 350 });
      trackUXEvent('viewport_fit', { source: 'bottom-left-zoom', scope: 'selected-node' });
      return;
    }
    const internalNodes = nodes
      .map((node) => getNode(node.id))
      .filter((node): node is NonNullable<typeof node> => Boolean(node));

    if (internalNodes.length > 0) {
      let minX = Number.POSITIVE_INFINITY;
      let minY = Number.POSITIVE_INFINITY;
      let maxX = Number.NEGATIVE_INFINITY;
      let maxY = Number.NEGATIVE_INFINITY;

      for (const internalNode of internalNodes) {
        const width = internalNode.width ?? internalNode.measured?.width ?? 160;
        const height = internalNode.height ?? internalNode.measured?.height ?? 100;
        const absolute = internalNode.positionAbsolute ?? internalNode.position;
        minX = Math.min(minX, absolute.x);
        minY = Math.min(minY, absolute.y);
        maxX = Math.max(maxX, absolute.x + width);
        maxY = Math.max(maxY, absolute.y + height);
      }

      const boundsWidth = Math.max(1, maxX - minX);
      const boundsHeight = Math.max(1, maxY - minY);
      const centerX = minX + boundsWidth / 2;
      const centerY = minY + boundsHeight / 2;
      const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
      const viewportHeight = typeof window !== 'undefined' ? window.innerHeight - 64 : 700;
      const zoomX = (viewportWidth * 0.78) / boundsWidth;
      const zoomY = (viewportHeight * 0.78) / boundsHeight;
      const targetZoom = Math.max(0.55, Math.min(1.55, zoomX, zoomY));

      setCenter(centerX, centerY, { zoom: targetZoom, duration: 350 });
    } else {
      fitView({ duration: 350, padding: 0.65, maxZoom: 1.55 });
    }
    trackUXEvent('viewport_fit', { source: 'bottom-left-zoom', scope: 'all-nodes' });
  }, [fitView, getNode, nodes, selectedNodeId, setCenter]);

  const onShare = useCallback(() => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        toast.success(locale === 'ko' ? 'URL이 복사되었습니다.' : 'URL copied to clipboard.', { id: 'share-copied' });
      })
      .catch(() => {
        toast.error(locale === 'ko' ? 'URL 복사에 실패했습니다.' : 'Failed to copy URL.');
      });
    if (accessRole === 'viewer') {
      trackUXEvent('share_link_copied_viewer', { source: 'top-bar' });
    }
  }, [accessRole, locale]);

  const onPaneContextMenu = useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    if (isTouchDevice) return;
    if (!canEdit) return;
    createNodeAtClientPoint(event.clientX, event.clientY, 'desktop-contextmenu');
  }, [canEdit, createNodeAtClientPoint, isTouchDevice]);

  const onPaneClick = useCallback((event: React.MouseEvent | React.TouchEvent) => {
    const resolvePoint = () => {
      if ('clientX' in event) return { x: event.clientX, y: event.clientY };
      const touch = event.touches[0] ?? event.changedTouches[0];
      return touch ? { x: touch.clientX, y: touch.clientY } : null;
    };

    if (interactionMode === 'add') {
      if (!canEdit) {
        handlePermissionDenied('edit');
        return;
      }
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
    setSelectedEdgeId(null);
  }, [canEdit, handlePermissionDenied, interactionMode, pendingConnection, setPendingConnection, setSelectedNodeId, setNodeActionSheetNodeId, createNodeAtClientPoint]);

  const onEdgeClick = useCallback((event: React.MouseEvent, edge: { id: string }) => {
    event.stopPropagation();
    if (!canEdit) {
      handlePermissionDenied('edit');
      return;
    }
    setSelectedEdgeId(edge.id);
  }, [canEdit, handlePermissionDenied]);

  const deleteSelectedEdge = useCallback(() => {
    if (!selectedEdgeId) return;
    setEdges(edges.filter((edge) => edge.id !== selectedEdgeId));
    setSelectedEdgeId(null);
  }, [selectedEdgeId, setEdges, edges]);

  const onPanePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchDevice || event.pointerType !== 'touch') return;
    const target = event.target as HTMLElement;
    if (!target.closest('.react-flow__pane') || target.closest('.react-flow__node')) return;

    panePanSessionRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      panStarted: false,
    };

    if (interactionMode !== 'add') {
      clearPaneLongPress();
      return;
    }
    if (!canEdit) return;

    clearPaneLongPress();
    paneLongPressPointRef.current = { x: event.clientX, y: event.clientY };
    paneLongPressTimerRef.current = window.setTimeout(() => {
      if (!paneLongPressPointRef.current) return;
      createNodeAtClientPoint(paneLongPressPointRef.current.x, paneLongPressPointRef.current.y, 'longpress-canvas');
      clearPaneLongPress();
    }, 350);
  }, [canEdit, isTouchDevice, interactionMode, clearPaneLongPress, createNodeAtClientPoint]);

  const onPanePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!panePanSessionRef.current) return;
    const dx = Math.abs(event.clientX - panePanSessionRef.current.startX);
    const dy = Math.abs(event.clientY - panePanSessionRef.current.startY);
    const movedEnough = dx > 10 || dy > 10;

    if (interactionMode === 'add' && movedEnough) {
      clearPaneLongPress();
    }

    if (interactionMode === 'select' && movedEnough && !panePanSessionRef.current.panStarted) {
      panePanSessionRef.current.panStarted = true;
      trackUXEvent('pane_pan_started', { source: 'touch-drag' });
    }
  }, [clearPaneLongPress, interactionMode]);

  const onPanePointerUp = useCallback(() => {
    if (panePanSessionRef.current?.panStarted) {
      trackUXEvent('pane_pan_completed', { source: 'touch-drag' });
    }
    panePanSessionRef.current = null;
    clearPaneLongPress();
  }, [clearPaneLongPress]);

  useEffect(() => {
    if (interactionMode !== 'connect' && pendingConnection) {
      setPendingConnection(null);
    }
  }, [interactionMode, pendingConnection, setPendingConnection]);

  useEffect(() => {
    if (canEdit) return;
    if (interactionMode !== 'select') {
      setInteractionMode('select');
    }
  }, [canEdit, interactionMode, setInteractionMode]);

  useEffect(() => {
    if (canEdit) return;
    if (selectedNodeId) {
      setSelectedNodeId(null);
    }
    if (nodeActionSheetNodeId) {
      setNodeActionSheetNodeId(null);
    }
    if (pendingConnection) {
      setPendingConnection(null);
    }
  }, [
    canEdit,
    selectedNodeId,
    nodeActionSheetNodeId,
    pendingConnection,
    setSelectedNodeId,
    setNodeActionSheetNodeId,
    setPendingConnection,
  ]);

  const completeCoachmarks = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ff_help_v1_seen', 'true');
    }
    setHasSeenHelpV1(true);
    setCoachmarkOpen(false);
    trackUXEvent('coachmark_completed', { surface: isTouchDevice ? 'mobile' : 'desktop' });
    trackUXEvent('help_tour_completed', { surface: isTouchDevice ? 'mobile' : 'desktop' });
  }, [setHasSeenHelpV1, isTouchDevice]);

  const openGuideFromCoachmark = useCallback(() => {
    completeCoachmarks();
    setHelpSheetOpen(true);
    trackUXEvent('help_sheet_opened', { surface: isTouchDevice ? 'mobile' : 'desktop', source: 'coachmark' });
  }, [completeCoachmarks, setHelpSheetOpen, isTouchDevice]);

  const isMapReady = !isLoading || !isInitialLoad;
  const actionSheetNode = nodeActionSheetNodeId ? nodes.find((node) => node.id === nodeActionSheetNodeId) : null;
  const isHudHidden = isTouchDevice && (Boolean(actionSheetNode) || isNodeEditorOpen);
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
        coach2: '캔버스를 길게 누르면 노드를 바로 만들 수 있어요.',
        coach3: '노드를 길게 누르면 편집/색상/삭제 액션시트를 엽니다.',
        coachDone: '확인',
        addHint: '추가: 빈 공간을 클릭하세요.',
        resizeHint: '크기: 모서리를 드래그하여 조절하세요.',
        deleteEdge: '연결선 삭제',
        connectHintStart: '연결: 소스 노드를 선택하세요.',
        connectHintTarget: '연결: 타깃 노드를 선택하세요.',
        readOnly: '읽기 전용',
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
        coach2: 'Long-press canvas to create a node quickly.',
        coach3: 'Long-press a node to open edit/color/delete actions.',
        coachDone: 'Got it',
        addHint: 'Add: tap empty space to create.',
        resizeHint: 'Resize: drag corners to adjust.',
        deleteEdge: 'Delete edge',
        connectHintStart: 'Connect: choose a source node.',
        connectHintTarget: 'Connect: choose a target node.',
        readOnly: 'Read only',
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
      onPointerUp={onPanePointerUp}
      onPointerCancel={onPanePointerUp}
    >
      <ReactFlow
        key={mapId ?? 'new'}
        nodes={nodes}
        edges={edges}
        onNodesChange={canEdit ? onNodesChange : () => {}}
        onEdgesChange={canEdit ? onEdgesChange : () => {}}
        onConnect={canEdit ? onConnect : () => {
          handlePermissionDenied('edit');
        }}
        onEdgeClick={onEdgeClick}
        onPaneContextMenu={onPaneContextMenu}
        onPaneClick={onPaneClick}
        onSelectionChange={({ nodes: selectedNodes, edges: selectedEdges }) => {
          if (!canEdit) {
            setSelectedNodeId(null);
            setSelectedEdgeId(null);
            return;
          }
          setSelectedNodeId(selectedNodes[0]?.id ?? null);
          setSelectedEdgeId(selectedEdges[0]?.id ?? null);
        }}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.8 }}
        elementsSelectable={canEdit}
        nodesFocusable={canEdit}
        edgesFocusable={canEdit}
        nodesDraggable={canEdit && (!isTouchDevice || interactionMode === 'select')}
        nodesConnectable={canEdit && (!isTouchDevice || interactionMode === 'connect')}
        snapToGrid
        snapGrid={[20, 20]}
        zoomOnPinch
        zoomOnScroll={!isTouchDevice}
        zoomOnDoubleClick={!isTouchDevice}
        panOnDrag={!isTouchDevice || interactionMode === 'select'}
        className={cn("bg-background", theme === 'dark' ? 'dark' : '')}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={25} size={1} color={theme === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)'} />
        {!isTouchDevice && (
          <MiniMap 
            nodeColor={(node) => (node.data.color as string) || (theme === 'dark' ? '#333' : '#eee')}
            nodeStrokeColor={(node) => node.selected ? 'var(--primary)' : 'transparent'}
            nodeStrokeWidth={3}
            maskColor={theme === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
          />
        )}
        {!isNarrowViewport && (
          <Panel position="top-left" className={cn("m-4")}>
            <div className="flex items-center gap-2">
              <Link href="/">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={locale === 'ko' ? '뒤로 가기' : 'Go back'}
                  className="h-10 w-10 rounded-full hover:bg-accent/20 transition-all group active:scale-95"
                >
                  <ArrowLeft className="h-6 w-6 transition-transform group-hover:-translate-x-1" />
                </Button>
              </Link>
              <Input 
                type="text" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                className="h-10 w-64 border-none bg-transparent font-bold text-xl focus-visible:ring-0 px-2 placeholder:text-muted-foreground/30"
                placeholder="Untitled Map" 
                disabled={!isMapReady || !canEdit}
              />
            </div>
          </Panel>
        )}
        <Panel position="top-right" className={cn("flex", isTouchDevice ? "m-3 gap-2" : "m-6 gap-3")}>
          <Card className="flex p-1 gap-0.5 bg-card/80 backdrop-blur-xl border-border/40 shadow-xl rounded-xl items-center">
            <Button
              onClick={() => {
                if (!canEdit) {
                  handlePermissionDenied('edit');
                  return;
                }
                save.mutate({ nodes, edges, title, targetMapId: mapId }, {
                  onError: () => handlePermissionDenied('edit'),
                });
              }}
              aria-label={locale === 'ko' ? '수동 저장' : 'Save manually'}
              disabled={save.isPending || !isMapReady || !canEdit}
              variant="ghost"
              size="icon"
              className={cn("rounded-lg hover:bg-accent/50", isTouchDevice ? "h-11 w-11" : "h-9 w-9")}
              title="Manual Save"
            >
              {save.isPending ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button
              onClick={onShare}
              variant="ghost"
              size="icon"
              aria-label={locale === 'ko' ? '공유 링크 복사' : 'Copy share link'}
              className={cn("rounded-lg hover:bg-accent/50", isTouchDevice ? "h-11 w-11" : "h-9 w-9")}
              title="Copy URL"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </Card>
        </Panel>

        {!canEdit && (
          <Panel position="top-center" className={isTouchDevice ? "mt-3" : "mt-4"}>
            <div className="rounded-full border border-border/50 bg-muted/85 px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground shadow-sm backdrop-blur">
              {uiText.readOnly}
            </div>
          </Panel>
        )}

        {isTouchDevice && canEdit && interactionMode === 'select' && (
          <Panel position="top-center" className="mt-3">
            <Card className="border-primary/20 bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur">
              {locale === 'ko' ? '선택 모드: 빈 공간을 드래그해 화면 이동' : 'Select mode: drag empty space to pan'}
            </Card>
          </Panel>
        )}

        {isTouchDevice && canEdit && interactionMode === 'connect' && (
          <Panel position="top-center" className="mt-3">
            <Card className="border-primary/20 bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur">
              {pendingConnection ? uiText.connectHintTarget : uiText.connectHintStart}
            </Card>
          </Panel>
        )}
        {isTouchDevice && canEdit && interactionMode === 'add' && (
          <Panel position="top-center" className="mt-3">
            <Card className="border-primary/20 bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur">
              {uiText.addHint}
            </Card>
          </Panel>
        )}
        {isTouchDevice && canEdit && interactionMode === 'resize' && (
          <Panel position="top-center" className="mt-3">
            <Card className="border-primary/20 bg-card/95 px-3 py-1.5 text-[11px] font-semibold shadow-lg backdrop-blur">
              {uiText.resizeHint}
            </Card>
          </Panel>
        )}

        <Panel
          position="bottom-left"
          className={cn(
            "pointer-events-auto relative z-[300] transition-all duration-150 ease-out before:pointer-events-none before:absolute before:-inset-1 before:-z-10 before:rounded-2xl before:bg-background before:content-['']",
            isTouchDevice && isHudHidden ? "opacity-0 pointer-events-none translate-y-3" : "opacity-100 translate-y-0"
          )}
          style={{
            marginLeft: isTouchDevice ? '0.75rem' : '1rem',
            marginBottom: isTouchDevice ? 'calc(env(safe-area-inset-bottom) + 0.5rem)' : '1rem',
          }}
        >
          <div className="rounded-2xl bg-background p-[2px]">
            <div className={cn(
              "relative isolate flex overflow-hidden rounded-xl border border-border/50 bg-card shadow-md",
              isTouchDevice ? "flex-col" : "flex-row"
            )}>
              <button
                type="button"
                aria-label={locale === 'ko' ? '화면 맞춤' : 'Fit view'}
                className={cn(
                  "relative grid place-items-center bg-transparent transition-colors hover:bg-accent/50 active:bg-accent/60",
                  isTouchDevice ? "h-[40px] w-[40px]" : "h-9 w-9"
                )}
                onClick={onFitViewport}
              >
                <Scan className="h-4 w-4" />
              </button>
              <div className={cn(isTouchDevice ? "h-px w-full" : "h-full w-px", "bg-border/80")} />
              <button
                type="button"
                aria-label={locale === 'ko' ? '확대' : 'Zoom in'}
                className={cn(
                  "relative grid place-items-center bg-transparent transition-colors hover:bg-accent/50 active:bg-accent/60",
                  isTouchDevice ? "h-[40px] w-[40px]" : "h-9 w-9"
                )}
                onClick={() => {
                  zoomIn({ duration: 180 });
                  trackUXEvent('viewport_zoom_in', { source: 'bottom-left-zoom' });
                }}
              >
                <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-1/2 top-1/2 h-[1.5px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-foreground" />
                  <span className="absolute left-1/2 top-1/2 h-[12px] w-[1.5px] -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-foreground" />
                </span>
              </button>
              <div className={cn(isTouchDevice ? "h-px w-full" : "h-full w-px", "bg-border/80")} />
              <button
                type="button"
                aria-label={locale === 'ko' ? '축소' : 'Zoom out'}
                className={cn(
                  "relative grid place-items-center bg-transparent transition-colors hover:bg-accent/50 active:bg-accent/60",
                  isTouchDevice ? "h-[40px] w-[40px]" : "h-9 w-9"
                )}
                onClick={() => {
                  zoomOut({ duration: 180 });
                  trackUXEvent('viewport_zoom_out', { source: 'bottom-left-zoom' });
                }}
              >
                <span aria-hidden className="pointer-events-none absolute left-1/2 top-1/2 h-[12px] w-[12px] -translate-x-1/2 -translate-y-1/2">
                  <span className="absolute left-1/2 top-1/2 h-[1.5px] w-[12px] -translate-x-1/2 -translate-y-1/2 rounded-[1px] bg-foreground" />
                </span>
              </button>
            </div>
          </div>
        </Panel>

        {isTouchDevice && canEdit && (
          <Panel
            position="bottom-center"
            className={cn(
              "pointer-events-auto !flex-row transition-all duration-150 ease-out",
              isHudHidden ? "opacity-0 pointer-events-none translate-y-3" : "opacity-100 translate-y-0"
            )}
            style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}
          >
            <Card className="flex flex-row flex-nowrap items-center gap-1 rounded-2xl border-border/40 bg-card/95 p-1.5 shadow-2xl backdrop-blur-xl">
              <Button variant={interactionMode === 'select' ? 'secondary' : 'ghost'} size="sm" className="h-11 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('select')}>
                <MousePointer2 className="h-3.5 w-3.5" />
                {uiText.modeSelect}
              </Button>
              <Button variant={interactionMode === 'add' ? 'secondary' : 'ghost'} size="sm" disabled={!canEdit} className="h-11 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('add')}>
                <Type className="h-3.5 w-3.5" />
                {uiText.modeAdd}
              </Button>
              <Button variant={interactionMode === 'connect' ? 'secondary' : 'ghost'} size="sm" disabled={!canEdit} className="h-11 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('connect')}>
                <Link2 className="h-3.5 w-3.5" />
                {uiText.modeConnect}
              </Button>
              <Button variant={interactionMode === 'resize' ? 'secondary' : 'ghost'} size="sm" disabled={!canEdit} className="h-11 shrink-0 whitespace-nowrap px-2.5 text-[11px]" onClick={() => setInteractionMode('resize')}>
                <Minimize2 className="h-3.5 w-3.5" />
                {uiText.modeResize}
              </Button>
            </Card>
          </Panel>
        )}

        {isTouchDevice && canEdit && selectedEdgeId && (
          <Panel position="bottom-center" style={{ marginBottom: 'calc(env(safe-area-inset-bottom) + 5.3rem)' }}>
            <Button type="button" variant="destructive" size="sm" className="h-10 rounded-xl px-4" onClick={deleteSelectedEdge}>
              <Trash2 className="h-4 w-4" />
              {uiText.deleteEdge}
            </Button>
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
                disabled={!canEdit}
                onClick={() => {
                  if (!canEdit) {
                    handlePermissionDenied('edit');
                    return;
                  }
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
                disabled={!canEdit}
                onClick={() => {
                  if (!canEdit) {
                    handlePermissionDenied('edit');
                    return;
                  }
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
                disabled={!canDelete}
                onClick={() => {
                  if (!canDelete) {
                    handlePermissionDenied('delete');
                    return;
                  }
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
                    disabled={!canEdit}
                    className="h-9 w-9 rounded-full p-0"
                    style={{ backgroundColor: color.value }}
                    aria-label={`${uiText.actionColor}: ${color.name}`}
                    onClick={() => {
                      if (!canEdit) {
                        handlePermissionDenied('edit');
                        return;
                      }
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

      {isTouchDevice && coachmarkOpen && !helpSheetOpen && !hasSeenHelpV1 && (
        <div className="absolute inset-0 z-[80] bg-background/70 backdrop-blur-[1px] p-4">
          <div className="flex h-full items-center justify-center">
            <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl">
              <div className="mb-3 flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <h3 className="text-sm font-bold">{uiText.coachTitle}</h3>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>{uiText.coach1}</p>
                <p>{uiText.coach2}</p>
                <p>{uiText.coach3}</p>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={completeCoachmarks}>
                  {locale === 'ko' ? '닫기' : 'Dismiss'}
                </Button>
                <Button size="sm" onClick={openGuideFromCoachmark}>
                  {locale === 'ko' ? '자세히 보기' : 'Open Guide'}
                </Button>
              </div>
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
