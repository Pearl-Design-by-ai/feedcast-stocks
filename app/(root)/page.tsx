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
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold text-gray-100">Dashboard</h1>
        <p className="max-w-3xl text-base font-semibold text-gray-200">What matters right now?</p>
      </header>
      <DataDisclaimer className="w-fit" />
      <DashboardShell
        initialLayout={layout}
        isAuthed={!!user}
        view={<DashboardView layout={layout} userId={userId} />}
      />
    </div>
  );
};

export default Home;
