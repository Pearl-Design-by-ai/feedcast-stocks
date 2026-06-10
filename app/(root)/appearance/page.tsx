import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import AppearanceSettings from '@/components/appearance/AppearanceSettings';
import { ACCENT_COLORS, type AccentColorId } from '@/lib/accent';
import { backgroundTone } from '@/lib/appearance';

export const metadata: Metadata = {
    title: 'Appearance',
    description:
        'Choose your background tone (shades of black) and accent color for FeedCast Markets.',
};

export default async function AppearancePage() {
    const supabase = await getSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect('https://www.feedcast.news/?signin=stocks');

    const { data } = await supabase
        .from('user_preferences')
        .select('reading_preferences')
        .eq('id', user.id)
        .maybeSingle();
    const prefs = (data?.reading_preferences as {
        accentColor?: string;
        marketsBackground?: string;
    } | null) ?? {};

    // 'black' (the main app's "no accent") and unknown ids fall back to gold,
    // matching how the layout resolves the brand color.
    const initialAccent: AccentColorId =
        prefs.accentColor && prefs.accentColor !== 'black' && prefs.accentColor in ACCENT_COLORS
            ? (prefs.accentColor as AccentColorId)
            : 'gold';
    const initialBackground = backgroundTone(prefs.marketsBackground).id;

    return (
        <div className="flex min-h-screen w-full flex-col gap-6 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-100">Appearance</h1>
                <p className="max-w-3xl text-sm text-gray-400">
                    Make Markets yours — pick a dark background tone and an accent color.
                    Choices save to your Feedcast profile and follow you across devices.
                </p>
            </header>

            <AppearanceSettings
                initialAccent={initialAccent}
                initialBackground={initialBackground}
            />
        </div>
    );
}
