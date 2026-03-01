import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Node, Edge } from 'reactflow';

export function useMindMap(mapId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['mind-map', mapId],
    queryFn: async () => {
      if (!mapId) return null;
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('id', mapId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!mapId,
    staleTime: 0, // Ensure we always get fresh data when navigating
  });

  const saveMutation = useMutation({
    mutationFn: async ({ nodes, edges, title }: { nodes: Node[], edges: Edge[], title: string }) => {
      if (!mapId) {
        const { data, error } = await supabase
          .from('maps')
          .insert({ nodes, edges, title })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from('maps')
          .update({ nodes, edges, title, updated_at: new Date().toISOString() })
          .eq('id', mapId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      // Update cache for both the specific map and the list
      queryClient.setQueryData(['mind-map', data.id], data);
      queryClient.invalidateQueries({ queryKey: ['mind-maps'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('maps')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mind-maps'] });
    },
  });

  return { ...query, save: saveMutation, deleteMap: deleteMutation };
}

export function useListMindMaps() {
  return useQuery({
    queryKey: ['mind-maps'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('maps')
        .select('id, title, updated_at, created_at')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
