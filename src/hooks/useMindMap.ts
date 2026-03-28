import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Node, Edge } from 'reactflow';

type AccessRole = 'owner' | 'viewer';

export function useMindMap(mapId?: string) {
  const queryClient = useQueryClient();

  const userQuery = useQuery({
    queryKey: ['auth-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      return user ?? null;
    },
    staleTime: 30_000,
  });

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

  const accessRole: AccessRole = !mapId
    ? 'owner'
    : query.data?.user_id && userQuery.data?.id === query.data.user_id
      ? 'owner'
      : 'viewer';
  const canEdit = accessRole === 'owner';
  const canDelete = !!mapId && accessRole === 'owner';
  const canShare = true as const;

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
        const { data: ownerRecord, error: ownerError } = await supabase
          .from('maps')
          .select('user_id')
          .eq('id', effectiveMapId)
          .single();
        if (ownerError) throw ownerError;
        if (!ownerRecord || ownerRecord.user_id !== user.id) {
          throw new Error('Only map owner can edit this map');
        }

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Authentication required to delete mind maps');

      const { data: ownerRecord, error: ownerError } = await supabase
        .from('maps')
        .select('user_id')
        .eq('id', id)
        .single();
      if (ownerError) throw ownerError;
      if (!ownerRecord || ownerRecord.user_id !== user.id) {
        throw new Error('Only map owner can delete this map');
      }

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

  return { ...query, save: saveMutation, deleteMap: deleteMutation, accessRole, canEdit, canDelete, canShare };
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
