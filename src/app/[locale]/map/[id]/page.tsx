import MapPageClient from './MapPageClient';
import { setRequestLocale } from 'next-intl/server';

export default async function MapPage({
  params
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <MapPageClient id={id} />;
}
