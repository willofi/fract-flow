import { create } from 'zustand';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';

interface MindMapState {
  nodes: Node[];
  edges: Edge[];
  version: number; // Used to track intentional changes for auto-save
  title: string;
  isInitialLoad: boolean;
  isTouchDevice: boolean;
  interactionMode: 'select' | 'add' | 'connect' | 'resize';
  selectedNodeId: string | null;
  nodeActionSheetNodeId: string | null;
  editingNodeId: string | null;
  isNodeEditorOpen: boolean;
  helpSheetOpen: boolean;
  hasSeenHelpV1: boolean;
  accessRole: 'owner' | 'viewer';
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setTitle: (title: string) => void;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  setIsTouchDevice: (isTouchDevice: boolean) => void;
  setInteractionMode: (mode: 'select' | 'add' | 'connect' | 'resize') => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setNodeActionSheetNodeId: (nodeId: string | null) => void;
  setEditingNodeId: (nodeId: string | null) => void;
  setNodeEditorOpen: (isNodeEditorOpen: boolean) => void;
  setHelpSheetOpen: (helpSheetOpen: boolean) => void;
  setHasSeenHelpV1: (hasSeenHelpV1: boolean) => void;
  setAccessControl: (access: { accessRole: 'owner' | 'viewer'; canEdit: boolean; canDelete: boolean; canShare: boolean }) => void;
  addNode: (node: Node) => void;
  deleteNode: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => void;
  setNodeColor: (nodeId: string, color: string) => void;
  resetGraph: () => void;
  pendingConnection: { nodeId: string; handleId: string } | null;
  setPendingConnection: (connection: { nodeId: string; handleId: string } | null) => void;
  isSaving: boolean;
  setIsSaving: (isSaving: boolean) => void;
}

export const useMindMapStore = create<MindMapState>((set, get) => ({
  nodes: [],
  edges: [],
  version: 0,
  title: 'New Mind Map',
  isInitialLoad: true,
  isTouchDevice: false,
  interactionMode: 'select',
  selectedNodeId: null,
  nodeActionSheetNodeId: null,
  editingNodeId: null,
  isNodeEditorOpen: false,
  helpSheetOpen: false,
  hasSeenHelpV1: false,
  accessRole: 'owner',
  canEdit: true,
  canDelete: true,
  canShare: true,
  pendingConnection: null,
  isSaving: false,
  onNodesChange: (changes: NodeChange[]) => {
    if (!get().canEdit) return;
    const nextNodes = applyNodeChanges(changes, get().nodes);
    const hasIntentionalChange = changes.some(c => c.type === 'position' || c.type === 'remove' || c.type === 'add');
    
    set({
      nodes: nextNodes,
      version: hasIntentionalChange ? get().version + 1 : get().version
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    if (!get().canEdit) return;
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const hasIntentionalChange = changes.some(c => c.type === 'remove' || c.type === 'add');

    set({
      edges: nextEdges,
      version: hasIntentionalChange ? get().version + 1 : get().version
    });
  },
  onConnect: (connection: Connection) => {
    if (!get().canEdit) return;
    set({
      edges: addEdge(connection, get().edges),
      pendingConnection: null,
      version: get().version + 1
    });
  },
  setNodes: (nodes: Node[]) => {
    set({ nodes });
  },
  setEdges: (edges: Edge[]) => {
    set({ edges });
  },
  setTitle: (title: string) => {
    set({ title });
  },
  setIsInitialLoad: (isInitialLoad: boolean) => {
    set({ isInitialLoad });
  },
  setIsTouchDevice: (isTouchDevice: boolean) => {
    set({ isTouchDevice });
  },
  setInteractionMode: (interactionMode) => {
    set({ interactionMode });
  },
  setSelectedNodeId: (selectedNodeId) => {
    set({ selectedNodeId });
  },
  setNodeActionSheetNodeId: (nodeActionSheetNodeId) => {
    set({ nodeActionSheetNodeId });
  },
  setEditingNodeId: (editingNodeId) => {
    set({ editingNodeId });
  },
  setNodeEditorOpen: (isNodeEditorOpen: boolean) => {
    set({ isNodeEditorOpen });
  },
  setHelpSheetOpen: (helpSheetOpen: boolean) => {
    set({ helpSheetOpen });
  },
  setHasSeenHelpV1: (hasSeenHelpV1: boolean) => {
    set({ hasSeenHelpV1 });
  },
  setAccessControl: ({ accessRole, canEdit, canDelete, canShare }) => {
    set({ accessRole, canEdit, canDelete, canShare });
  },
  addNode: (node: Node) => {
    if (!get().canEdit) return;
    set({
      nodes: [...get().nodes, node],
      version: get().version + 1
    });
  },
  deleteNode: (nodeId: string) => {
    if (!get().canDelete) return;
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      nodeActionSheetNodeId: get().nodeActionSheetNodeId === nodeId ? null : get().nodeActionSheetNodeId,
      pendingConnection: get().pendingConnection?.nodeId === nodeId ? null : get().pendingConnection,
      version: get().version + 1
    });
  },
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
    if (!get().canEdit) return;
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, ...data } };
        }
        return node;
      }),
      version: get().version + 1
    });
  },
  setNodeColor: (nodeId: string, color: string) => {
    if (!get().canEdit) return;
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: { ...node.data, color } };
        }
        return node;
      }),
      version: get().version + 1
    });
  },
  resetGraph: () => {
    set({
      nodes: [],
      edges: [],
      version: 0,
      title: 'Loading...',
      isInitialLoad: true,
      pendingConnection: null,
      selectedNodeId: null,
      nodeActionSheetNodeId: null,
      editingNodeId: null,
      isNodeEditorOpen: false,
      helpSheetOpen: false,
      interactionMode: 'select',
      accessRole: 'owner',
      canEdit: true,
      canDelete: true,
      canShare: true
    });
  },
  setPendingConnection: (pendingConnection) => {
    set({ pendingConnection });
  },
  setIsSaving: (isSaving: boolean) => {
    set({ isSaving });
  },
}));
