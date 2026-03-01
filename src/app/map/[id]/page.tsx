'use client';

import MindMap from '@/components/MindMap';
import { useParams } from 'next/navigation';

export default function MapPage() {
  const { id } = useParams();
  const mapId = id === 'new' ? undefined : (id as string);

  return <MindMap mapId={mapId} />;
}
