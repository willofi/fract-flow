import NewMapPageClient from './NewMapPageClient';
import { setRequestLocale } from 'next-intl/server';

export default async function NewMapPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <NewMapPageClient />;
}
