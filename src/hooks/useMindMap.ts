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
    staleTime: 0,
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      nodes,
      edges,
      title,
      targetMapId,
    }: {
      nodes: Node[];
      edges: Edge[];
      title: string;
      targetMapId?: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required to save mind maps');

      const effectiveMapId = targetMapId ?? mapId;

      if (!effectiveMapId) {
        // Create new map
        const { data, error } = await supabase
          .from('maps')
          .insert({ 
            nodes, 
            edges, 
            title, 
            user_id: user.id // 명시적으로 사용자 ID 할당
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        // Update existing map
        const { data, error } = await supabase
          .from('maps')
          .update({ 
            nodes, 
            edges, 
            title, 
            updated_at: new Date().toISOString() 
          })
          .eq('id', effectiveMapId)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('maps')
        .select('id, title, updated_at, created_at')
        .eq('user_id', user.id) // 본인 소유의 마인드맵만 조회
        .order('updated_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });
}
