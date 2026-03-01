import { createClient } from '@/utils/supabase/server';
import { LandingView } from '@/components/LandingView';
import { DashboardView } from '@/components/DashboardView';

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <LandingView />;
  }

  return <DashboardView />;
}
