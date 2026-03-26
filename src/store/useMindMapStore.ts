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
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setTitle: (title: string) => void;
  setIsInitialLoad: (isInitialLoad: boolean) => void;
  addNode: (node: Node) => void;
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
  pendingConnection: null,
  isSaving: false,
  onNodesChange: (changes: NodeChange[]) => {
    const nextNodes = applyNodeChanges(changes, get().nodes);
    const hasIntentionalChange = changes.some(c => c.type === 'position' || c.type === 'remove' || c.type === 'add');
    
    set({
      nodes: nextNodes,
      version: hasIntentionalChange ? get().version + 1 : get().version
    });
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    const nextEdges = applyEdgeChanges(changes, get().edges);
    const hasIntentionalChange = changes.some(c => c.type === 'remove' || c.type === 'add');

    set({
      edges: nextEdges,
      version: hasIntentionalChange ? get().version + 1 : get().version
    });
  },
  onConnect: (connection: Connection) => {
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
  addNode: (node: Node) => {
    set({
      nodes: [...get().nodes, node],
      version: get().version + 1
    });
  },
  updateNodeData: (nodeId: string, data: Record<string, unknown>) => {
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
      pendingConnection: null
    });
  },
  setPendingConnection: (pendingConnection) => {
    set({ pendingConnection });
  },
  setIsSaving: (isSaving: boolean) => {
    set({ isSaving });
  },
}));
