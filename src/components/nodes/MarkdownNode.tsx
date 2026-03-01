'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from 'reactflow';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-markdown';
import { useMindMapStore } from '@/store/useMindMapStore';
import { cn } from '@/lib/utils';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuLabel,
  ContextMenuSeparator,
} from "@/components/ui/context-menu";

export function MarkdownNode({ id, data, selected }: NodeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(data.label || '');
  const [hoveredAnchor, setHoveredAnchor] = useState<string | null>(null);
  
  const updateNodeData = useMindMapStore((state) => state.updateNodeData);
  const setNodeColor = useMindMapStore((state) => state.setNodeColor);
  const onConnect = useMindMapStore((state) => state.onConnect);
  const pendingConnection = useMindMapStore((state) => state.pendingConnection);
  const setPendingConnection = useMindMapStore((state) => state.setPendingConnection);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const onDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  }, []);

  const onBlur = useCallback(() => {
    setIsEditing(false);
    updateNodeData(id, { label: content });
  }, [id, content, updateNodeData]);

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

  const handleHandleClick = (e: React.MouseEvent, anchorId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (pendingConnection) {
      if (pendingConnection.nodeId !== id) {
        onConnect({
          source: pendingConnection.nodeId,
          sourceHandle: pendingConnection.handleId,
          target: id,
          targetHandle: anchorId,
        });
      } else {
        setPendingConnection(null);
      }
    } else {
      setPendingConnection({ nodeId: id, handleId: anchorId });
    }
  };

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(content.length, content.length);
    }
  }, [isEditing, content.length]);

  const isSource = pendingConnection?.nodeId === id;

  return (
    <>
      {/* 
        RESIZER: Dedicated to the side 25% areas and corners.
        We'll use custom handle positions to ensure they don't overlap the center 50%.
      */}
      <NodeResizer 
        minWidth={80} 
        minHeight={32} 
        isVisible={selected} 
        lineClassName="border-muted-foreground/10"
        handleClassName="!w-2 !h-2 !bg-muted-foreground/20 !border-none !rounded-none"
      />
      
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div 
            ref={containerRef}
            onDoubleClick={onDoubleClick}
            onMouseMove={onMouseMove}
            onMouseLeave={onMouseLeave}
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
              onClick={(e) => handleHandleClick(e, 't')}
              style={{ 
                top: '-1px', left: '50%', transform: 'translateX(-50%)', 
                width: '50%', height: '8px', 
                background: 'transparent', border: 'none', padding: 0, 
                zIndex: 100, cursor: 'crosshair', opacity: 0 
              }} 
            />
            
            {/* Bottom Connection Zone (25% to 75%) */}
            <Handle 
              type="source" position={Position.Bottom} id="b" 
              onClick={(e) => handleHandleClick(e, 'b')}
              style={{ 
                bottom: '-1px', left: '50%', transform: 'translateX(-50%)', 
                width: '50%', height: '8px', 
                background: 'transparent', border: 'none', padding: 0, 
                zIndex: 100, cursor: 'crosshair', opacity: 0 
              }} 
            />
            
            {/* Left Connection Zone (25% to 75%) */}
            <Handle 
              type="source" position={Position.Left} id="l" 
              onClick={(e) => handleHandleClick(e, 'l')}
              style={{ 
                left: '-1px', top: '50%', transform: 'translateY(-50%)', 
                height: '50%', width: '8px', 
                background: 'transparent', border: 'none', padding: 0, 
                zIndex: 100, cursor: 'crosshair', opacity: 0 
              }} 
            />
            
            {/* Right Connection Zone (25% to 75%) */}
            <Handle 
              type="source" position={Position.Right} id="r" 
              onClick={(e) => handleHandleClick(e, 'r')}
              style={{ 
                right: '-1px', top: '50%', transform: 'translateY(-50%)', 
                height: '50%', width: '8px', 
                background: 'transparent', border: 'none', padding: 0, 
                zIndex: 100, cursor: 'crosshair', opacity: 0 
              }} 
            />

            {/* VISUAL ANCHOR CIRCLES: Exact center, only visible when hovered in center 50% zone */}
            <div className={cn("handle-indicator-circle", (hoveredAnchor === 't' || (isSource && pendingConnection?.handleId === 't')) && "active")} style={{ top: '0', left: '50%' }} />
            <div className={cn("handle-indicator-circle", (hoveredAnchor === 'b' || (isSource && pendingConnection?.handleId === 'b')) && "active")} style={{ top: '100%', left: '50%' }} />
            <div className={cn("handle-indicator-circle", (hoveredAnchor === 'l' || (isSource && pendingConnection?.handleId === 'l')) && "active")} style={{ top: '50%', left: '0' }} />
            <div className={cn("handle-indicator-circle", (hoveredAnchor === 'r' || (isSource && pendingConnection?.handleId === 'r')) && "active")} style={{ top: '50%', left: '100%' }} />
            
            {/* INTERIOR CONTENT: Drag zone */}
            <div className="flex-1 overflow-hidden pointer-events-none flex items-center justify-center p-1">
              {isEditing ? (
                <div className="w-full h-full pointer-events-auto overflow-auto scrollbar-hide flex items-start justify-center pt-2">
                  <Editor
                    value={content}
                    onValueChange={code => setContent(code)}
                    highlight={code => highlight(code, languages.markdown, 'markdown')}
                    padding={4}
                    onBlur={onBlur}
                    style={{
                      fontFamily: '"Fira code", "Fira Mono", monospace',
                      fontSize: '8px',
                      width: '100%',
                      minHeight: '100%',
                      textAlign: 'left',
                      backgroundColor: 'transparent', // 편집 시 배경 투명 (노드 색상 유지)
                      color: 'inherit',
                      lineHeight: '1.2',
                    }}
                    textareaClassName="focus:ring-0 outline-none !p-1 text-foreground"
                    preClassName="!p-1"
                  />
                </div>
              ) : (
                <div className="prose prose-xs dark:prose-invert max-w-none break-words leading-tight tracking-tight pointer-events-auto text-[8px] font-semibold px-1 w-full h-full flex flex-col items-center justify-center">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        if (!inline) {
                          return (
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match ? match[1] : 'javascript'}
                              PreTag="div"
                              className="rounded-md my-1 text-left shadow-sm w-full"
                              customStyle={{
                                fontSize: '8px',
                                lineHeight: '1.2',
                                padding: '6px',
                                margin: '2px 0',
                                background: '#1e1e1e',
                              }}
                              codeTagProps={{
                                style: {
                                  fontSize: '8px', // 내부 코드 태그 크기 강제 고정
                                  lineHeight: '1.2',
                                  fontFamily: 'inherit',
                                }
                              }}
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
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
                    {content || '*Empty*'}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          </div>
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
    </>
  );
}
