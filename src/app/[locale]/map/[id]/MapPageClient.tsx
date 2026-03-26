'use client';

import MindMap from '@/components/MindMap';

export default function MapPageClient({ id }: { id: string }) {
  const mapId = id === 'new' ? undefined : id;
  return <MindMap key={mapId ?? 'new'} mapId={mapId} />;
}
