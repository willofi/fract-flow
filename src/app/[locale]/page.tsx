import { createClient } from '@/utils/supabase/server';
import { LandingView } from '@/components/LandingView';
import { DashboardView } from '@/components/DashboardView';
import { setRequestLocale } from 'next-intl/server';

export default async function Home({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  setRequestLocale(locale);
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingView />;
  }

  return <DashboardView />;
}
