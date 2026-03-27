'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import vscDarkPlus from 'react-syntax-highlighter/dist/esm/styles/prism/vsc-dark-plus';
import { useMindMapStore } from '@/store/useMindMapStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";
import { trackUXEvent } from '@/lib/ux-events';

export function MarkdownNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.label || '');
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);
  
  const updateNodeData = useMindMapStore((state) => state.updateNodeData);
  const setNodeColor = useMindMapStore((state) => state.setNodeColor);
  const onConnect = useMindMapStore((state) => state.onConnect);
  const pendingConnection = useMindMapStore((state) => state.pendingConnection);
  const setPendingConnection = useMindMapStore((state) => state.setPendingConnection);
  const interactionMode = useMindMapStore((state) => state.interactionMode);
  const setInteractionMode = useMindMapStore((state) => state.setInteractionMode);
  const isTouchDevice = useMindMapStore((state) => state.isTouchDevice);
  const selectedNodeId = useMindMapStore((state) => state.selectedNodeId);
  const setSelectedNodeId = useMindMapStore((state) => state.setSelectedNodeId);
  const setNodeActionSheetNodeId = useMindMapStore((state) => state.setNodeActionSheetNodeId);
  const nodes = useMindMapStore((state) => state.nodes);
  const editingNodeId = useMindMapStore((state) => state.editingNodeId);
  const setEditingNodeId = useMindMapStore((state) => state.setEditingNodeId);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const editorPanelRef = useRef<HTMLDivElement>(null);
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const latestContentRef = useRef(content);
  const latestLabelRef = useRef((data.label as string) || '');
  const initialEditContentRef = useRef((data.label as string) || '');
  const longPressTimerRef = useRef<number | null>(null);
  const longPressStartRef = useRef<{ x: number; y: number } | null>(null);
  const movedDuringTouchRef = useRef(false);
  const touchedDuringGestureRef = useRef(false);
  const longPressTriggeredRef = useRef(false);

  useEffect(() => {
    latestContentRef.current = content;
  }, [content]);

  useEffect(() => {
    latestLabelRef.current = (data.label as string) || '';
  }, [data.label]);

  const clearLongPress = useCallback(() => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    movedDuringTouchRef.current = false;
    longPressTriggeredRef.current = false;
    longPressStartRef.current = null;
  }, []);

  useEffect(() => {
    return () => clearLongPress();
  }, [clearLongPress]);

  const openEditor = useCallback(() => {
    const nextLabel = (data.label as string) || '';
    initialEditContentRef.current = nextLabel;
    setContent(nextLabel);
    setIsEditing(true);
  }, [data.label]);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTouchDevice) return;
    openEditor();
  }, [isTouchDevice, openEditor]);

  const commitEdit = useCallback(() => {
    const nextContent = latestContentRef.current;
    setIsEditing(false);
    if (latestLabelRef.current !== nextContent) {
      updateNodeData(id, { label: nextContent });
      trackUXEvent('node_edited', { source: isTouchDevice ? 'mobile' : 'desktop' });
    }
    initialEditContentRef.current = nextContent;
  }, [id, updateNodeData, isTouchDevice]);

  const cancelEdit = useCallback(() => {
    setContent(data.label || '');
    setIsEditing(false);
  }, [data.label]);

  const requestCloseEdit = useCallback(() => {
    const isDirty = latestContentRef.current !== initialEditContentRef.current;
    if (isTouchDevice && isDirty) {
      const shouldDiscard = window.confirm('Discard unsaved changes? / 저장하지 않은 변경 사항을 버릴까요?');
      if (!shouldDiscard) return;
    }
    cancelEdit();
  }, [cancelEdit, isTouchDevice]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current || isEditing) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const w = rect.width;
    const h = rect.height;

    // Check if mouse is in the 50% center zone of any edge
    const isInCenterH = x > w * 0.25 && x < w * 0.75;
    const isInCenterV = y > h * 0.25 && y < h * 0.75;

    // Distances to borders
    const distTop = y;
    const distBottom = h - y;
    const distLeft = x;
    const distRight = w - x;

    const minDist = Math.min(distTop, distBottom, distLeft, distRight);
    
    if (minDist > 15) { // Threshold for showing handle indicator
      setHoveredAnchor(null);
      return;
    }

    if (minDist === distTop && isInCenterH) setHoveredAnchor('t');
    else if (minDist === distBottom && isInCenterH) setHoveredAnchor('b');
    else if (minDist === distLeft && isInCenterV) setHoveredAnchor('l');
    else if (minDist === distRight && isInCenterV) setHoveredAnchor('r');
    else setHoveredAnchor(null);
  }, [isEditing]);

  const onMouseLeave = useCallback(() => setHoveredAnchor(null), []);

  const resolveClosestAnchor = useCallback((sourceId: string, targetId: string): string => {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    const targetNode = nodes.find((node) => node.id === targetId);
    if (!sourceNode || !targetNode) return 't';

    const dx = targetNode.position.x - sourceNode.position.x;
    const dy = targetNode.position.y - sourceNode.position.y;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'l' : 'r';
    return dy > 0 ? 't' : 'b';
  }, [nodes]);

  const onNodeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (interactionMode === 'connect') {
      if (pendingConnection && pendingConnection.nodeId !== id) {
        onConnect({
          source: pendingConnection.nodeId,
          sourceHandle: pendingConnection.handleId,
          target: id,
          targetHandle: resolveClosestAnchor(pendingConnection.nodeId, id),
        });
        trackUXEvent('connect_completed', { source: 'node-tap' });
        if (isTouchDevice) {
          setInteractionMode('select');
        }
        return;
      }
      setSelectedNodeId(id);
      return;
    }

    if (isTouchDevice) {
      if (interactionMode !== 'select') return;
      if (touchedDuringGestureRef.current || longPressTriggeredRef.current) {
        touchedDuringGestureRef.current = false;
        longPressTriggeredRef.current = false;
        return;
      }
    }

    setSelectedNodeId(id);
    if (pendingConnection) {
      setPendingConnection(null);
      trackUXEvent('mis_tap_connect_cancelled', { source: 'node-click-non-connect' });
    }
  }, [id, interactionMode, isTouchDevice, onConnect, pendingConnection, resolveClosestAnchor, setInteractionMode, setPendingConnection, setSelectedNodeId]);

  const handleHandleClick = (e: React.MouseEvent, anchorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (interactionMode !== 'connect') return;
    setSelectedNodeId(id);
    if (pendingConnection) {
      if (pendingConnection.nodeId !== id) {
        onConnect({
          source: pendingConnection.nodeId,
          sourceHandle: pendingConnection.handleId,
          target: id,
          targetHandle: anchorId,
        });
        trackUXEvent('connect_completed', { source: 'anchor' });
        if (isTouchDevice) {
          setInteractionMode('select');
        }
      } else {
        setPendingConnection(null);
      }
    } else {
      setPendingConnection({ nodeId: id, handleId: anchorId });
      trackUXEvent('connect_started', { source: 'anchor' });
    }
  };

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchDevice || e.pointerType !== 'touch') return;
    touchedDuringGestureRef.current = false;
    movedDuringTouchRef.current = false;
    longPressTriggeredRef.current = false;
    setSelectedNodeId(id);
    if (interactionMode !== 'select') return;
    clearLongPress();
    longPressStartRef.current = { x: e.clientX, y: e.clientY };
    longPressTimerRef.current = window.setTimeout(() => {
      longPressTriggeredRef.current = true;
      setSelectedNodeId(id);
      setNodeActionSheetNodeId(id);
      trackUXEvent('action_sheet_opened', { source: 'node-longpress' });
      clearLongPress();
    }, 350);
  }, [clearLongPress, id, interactionMode, isTouchDevice, setNodeActionSheetNodeId, setSelectedNodeId]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!longPressStartRef.current) return;
    const dx = Math.abs(e.clientX - longPressStartRef.current.x);
    const dy = Math.abs(e.clientY - longPressStartRef.current.y);
    if (dx > 12 || dy > 12) {
      touchedDuringGestureRef.current = true;
      movedDuringTouchRef.current = true;
      clearLongPress();
    }
  }, [clearLongPress]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isTouchDevice || e.pointerType !== 'touch') {
      clearLongPress();
      return;
    }

    if (interactionMode !== 'connect' && !movedDuringTouchRef.current && !longPressTriggeredRef.current) {
      setSelectedNodeId(id);
    }

    clearLongPress();
  }, [clearLongPress, id, interactionMode, isTouchDevice, setSelectedNodeId]);

  useEffect(() => {
    if (!isEditing) return;

    const timer = window.setTimeout(() => {
      if (!editorTextareaRef.current) return;
      editorTextareaRef.current.focus();
      const cursorPos = latestContentRef.current.length;
      editorTextareaRef.current.setSelectionRange(cursorPos, cursorPos);
    }, 0);

    const handleOutsideClick = (event: PointerEvent) => {
      if (!editorPanelRef.current) return;
      if (!editorPanelRef.current.contains(event.target as globalThis.Node)) {
        commitEdit();
      }
    };

    document.addEventListener('pointerdown', handleOutsideClick, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('pointerdown', handleOutsideClick, true);
    };
  }, [isEditing, commitEdit]);

  useEffect(() => {
    if (editingNodeId !== id) return;
    const rafId = window.requestAnimationFrame(() => {
      openEditor();
      setEditingNodeId(null);
    });
    return () => window.cancelAnimationFrame(rafId);
  }, [editingNodeId, id, openEditor, setEditingNodeId]);

  const isSource = pendingConnection?.nodeId === id;
  const shouldShowConnectUI = interactionMode === 'connect' && (selectedNodeId === id || isSource);
  const handleThickness = shouldShowConnectUI ? 24 : 8;
  const showDesktopHoverIndicator = !isTouchDevice && interactionMode === 'connect';
  const showResizer = (selected || selectedNodeId === id) && (!isTouchDevice || interactionMode === 'resize');
  const nodeSurface = (
    <div 
      ref={containerRef}
      onDoubleClick={onDoubleClick}
      onClick={onNodeClick}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={clearLongPress}
      onContextMenu={(e) => {
        if (isTouchDevice) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      style={{ backgroundColor: data.color || 'var(--card)' }}
      className={cn(
        "node-container group w-full h-full min-w-[80px] min-h-[32px] flex flex-col transition-all duration-300 relative overflow-visible cursor-grab active:cursor-grabbing",
        selected && "selected"
      )}
    >
      {/* 
        50% CENTER CONNECTION HANDLES: 
        Functional handles cover exactly the center 50% of each edge.
        Center pinpoint (-1px sinking) maintained for perfect line start.
      */}
      
      {/* Top Connection Zone (25% to 75%) */}
      <Handle 
        type="source" position={Position.Top} id="t" 
        className={cn(shouldShowConnectUI ? "ff-connect-handle--enabled" : "ff-connect-handle--disabled")}
        onClick={(e) => handleHandleClick(e, 't')}
        style={{ 
          top: '-1px', left: '50%', transform: 'translateX(-50%)', 
          width: '50%', height: `${handleThickness}px`,
          background: 'transparent', border: 'none', padding: 0, 
          zIndex: 100, cursor: 'crosshair', opacity: 0
        }} 
      />
      
      {/* Bottom Connection Zone (25% to 75%) */}
      <Handle 
        type="source" position={Position.Bottom} id="b" 
        className={cn(shouldShowConnectUI ? "ff-connect-handle--enabled" : "ff-connect-handle--disabled")}
        onClick={(e) => handleHandleClick(e, 'b')}
        style={{ 
          bottom: '-1px', left: '50%', transform: 'translateX(-50%)', 
          width: '50%', height: `${handleThickness}px`,
          background: 'transparent', border: 'none', padding: 0, 
          zIndex: 100, cursor: 'crosshair', opacity: 0
        }} 
      />
      
      {/* Left Connection Zone (25% to 75%) */}
      <Handle 
        type="source" position={Position.Left} id="l" 
        className={cn(shouldShowConnectUI ? "ff-connect-handle--enabled" : "ff-connect-handle--disabled")}
        onClick={(e) => handleHandleClick(e, 'l')}
        style={{ 
          left: '-1px', top: '50%', transform: 'translateY(-50%)', 
          height: '50%', width: `${handleThickness}px`,
          background: 'transparent', border: 'none', padding: 0, 
          zIndex: 100, cursor: 'crosshair', opacity: 0
        }} 
      />
      
      {/* Right Connection Zone (25% to 75%) */}
      <Handle 
        type="source" position={Position.Right} id="r" 
        className={cn(shouldShowConnectUI ? "ff-connect-handle--enabled" : "ff-connect-handle--disabled")}
        onClick={(e) => handleHandleClick(e, 'r')}
        style={{ 
          right: '-1px', top: '50%', transform: 'translateY(-50%)', 
          height: '50%', width: `${handleThickness}px`,
          background: 'transparent', border: 'none', padding: 0, 
          zIndex: 100, cursor: 'crosshair', opacity: 0
        }} 
      />

      {/* VISUAL ANCHOR CIRCLES: Exact center, only visible when hovered in center 50% zone */}
      <div className={cn("handle-indicator-circle", (((showDesktopHoverIndicator && hoveredAnchor === 't') || (isSource && pendingConnection?.handleId === 't')) && shouldShowConnectUI) && "active")} style={{ top: '0', left: '50%' }} />
      <div className={cn("handle-indicator-circle", (((showDesktopHoverIndicator && hoveredAnchor === 'b') || (isSource && pendingConnection?.handleId === 'b')) && shouldShowConnectUI) && "active")} style={{ top: '100%', left: '50%' }} />
      <div className={cn("handle-indicator-circle", (((showDesktopHoverIndicator && hoveredAnchor === 'l') || (isSource && pendingConnection?.handleId === 'l')) && shouldShowConnectUI) && "active")} style={{ top: '50%', left: '0' }} />
      <div className={cn("handle-indicator-circle", (((showDesktopHoverIndicator && hoveredAnchor === 'r') || (isSource && pendingConnection?.handleId === 'r')) && shouldShowConnectUI) && "active")} style={{ top: '50%', left: '100%' }} />
      
      {/* INTERIOR CONTENT: Drag zone */}
      <div className="flex-1 overflow-hidden pointer-events-none flex items-center justify-center p-1 relative">
        {!isEditing && (
          <div className="prose prose-xs dark:prose-invert max-w-none break-words leading-tight tracking-tight pointer-events-auto text-[8px] font-semibold px-1 w-full h-full flex flex-col items-center justify-center">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code({
                  inline,
                  className,
                  children,
                  ...props
                }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean; node?: unknown }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeText = String(children).replace(/\n$/, '');
                  const isBlockCode = Boolean(match) || codeText.includes('\n');

                  if (!inline && isBlockCode) {
                    return (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match ? match[1] : 'javascript'}
                        PreTag="span"
                        className="rounded-md my-1 text-left shadow-sm w-full"
                        customStyle={{
                          fontSize: '8px',
                          lineHeight: '1.2',
                          padding: '6px',
                          margin: '2px 0',
                          background: '#1e1e1e',
                          display: 'block',
                          }}
                        codeTagProps={{
                          style: {
                            fontSize: '8px', // 내부 코드 태그 크기 강제 고정
                            lineHeight: '1.2',
                            fontFamily: 'inherit',
                          }
                        }}
                      >
                        {codeText}
                      </SyntaxHighlighter>
                    );
                  }
                  return (
                    <code className={cn("bg-[#1e1e1e] text-[#ce9178] px-0.5 rounded-sm font-mono text-[8px]", className)} {...props}>
                      {children}
                    </code>
                  );
                }
              }}
            >
              {(data.label as string) || '*Empty*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* 
        RESIZER: Dedicated to the side 25% areas and corners.
        We'll use custom handle positions to ensure they don't overlap the center 50%.
      */}
      {showResizer && (
        <NodeResizer 
          minWidth={80} 
          minHeight={32} 
          isVisible
          onResizeEnd={() => trackUXEvent('resize_completed', { source: isTouchDevice ? 'mobile' : 'desktop' })}
          lineClassName="border-muted-foreground/10"
          handleClassName={cn(
            "!bg-muted-foreground/20 !border-none",
            isTouchDevice ? "!w-7 !h-7 !rounded-sm" : "!w-2 !h-2 !rounded-none"
          )}
        />
      )}

      {isTouchDevice ? (
        nodeSurface
      ) : (
        <ContextMenu>
          <ContextMenuTrigger asChild>
            {nodeSurface}
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52 bg-card/95 backdrop-blur-xl border-border/60 p-3 shadow-2xl rounded-2xl">
            <ContextMenuLabel className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/60">Node Color</ContextMenuLabel>
            <ContextMenuSeparator className="mb-2 opacity-40" />
            <div className="grid grid-cols-4 gap-2">
              {[
                { name: 'Default', value: 'var(--card)' },
                { name: 'Blue', value: 'var(--node-blue)' },
                { name: 'Green', value: 'var(--node-green)' },
                { name: 'Yellow', value: 'var(--node-yellow)' },
                { name: 'Orange', value: 'var(--node-orange)' },
                { name: 'Red', value: 'var(--node-red)' },
                { name: 'Purple', value: 'var(--node-purple)' },
                { name: 'Pink', value: 'var(--node-pink)' },
              ].map((c) => (
                <ContextMenuItem key={c.name} onClick={() => setNodeColor(id, c.value)} className="h-9 w-9 rounded-xl border border-border/40 p-0 hover:scale-110 transition-transform cursor-pointer" style={{ backgroundColor: c.value }} />
              ))}
            </div>
          </ContextMenuContent>
        </ContextMenu>
      )}
      {typeof document !== 'undefined' && isEditing && createPortal(
        <div className="fixed inset-0 z-[2000] pointer-events-auto animate-in fade-in duration-200">
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div
              ref={editorPanelRef}
              className="nodrag nowheel w-[min(92vw,640px)] min-h-[320px] bg-card border-2 border-primary/30 rounded-2xl shadow-[0_24px_80px_-12px_rgba(0,0,0,0.45)] p-5 animate-in zoom-in-95 slide-in-from-bottom-3 duration-200"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[11px] font-black uppercase tracking-[0.2em] text-primary/85">
                  Markdown Editor
                </div>
                {isTouchDevice ? (
                  <div className="flex items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={requestCloseEdit}>
                      Close
                    </Button>
                    <Button type="button" size="sm" className="h-8 text-xs" onClick={commitEdit}>
                      Save
                    </Button>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-primary">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    Editing
                  </div>
                )}
              </div>
              <textarea
                ref={editorTextareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    requestCloseEdit();
                  }
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault();
                    commitEdit();
                  }
                }}
                className="w-full min-h-[250px] resize-y rounded-xl border border-border/60 bg-background px-3.5 py-3 font-mono text-[14px] leading-relaxed text-foreground caret-primary outline-none ring-0 focus:border-primary/50 focus:shadow-[0_0_0_2px_rgba(var(--primary-rgb),0.15)]"
              />
              {!isTouchDevice && (
                <div className="mt-3 flex items-center justify-between text-[10px] font-semibold text-muted-foreground/85">
                  <span>Esc: cancel</span>
                  <span>Ctrl/Cmd + Enter: save</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
