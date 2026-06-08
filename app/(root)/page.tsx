import DataDisclaimer from '@/components/DataDisclaimer';
import DashboardShell from '@/components/dashboard/DashboardShell';
import DashboardView from '@/components/dashboard/DashboardView';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { getDashboardLayout } from '@/lib/actions/dashboard-layout.actions';
import { DEFAULT_LAYOUT } from '@/lib/dashboard/catalog';

const Home = async () => {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id ?? '';

  // A member's saved layout, or the default (the original fixed widgets).
  const saved = await getDashboardLayout();
  const layout = saved ?? DEFAULT_LAYOUT;

  return (
    <div className="flex min-h-screen w-full flex-col gap-6">
      <DataDisclaimer className="w-fit" />
      <DashboardShell
        initialLayout={layout}
        view={<DashboardView layout={layout} userId={userId} />}
      />
    </div>
  );
};

export default Home;
