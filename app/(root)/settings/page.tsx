import type { Metadata } from 'next';
import ThemeSettings from '@/components/theme/ThemeSettings';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Personalize your FeedCast Stocks experience.',
};

export default function SettingsPage() {
    return (
        <div className="flex min-h-screen w-full flex-col gap-8 p-4 md:p-8">
            <header className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
                <p className="text-sm text-gray-400">Personalize how FeedCast Stocks looks.</p>
            </header>

            <section className="flex max-w-3xl flex-col gap-4">
                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-semibold text-gray-100">Appearance</h2>
                    <p className="text-sm text-gray-400">
                        Choose a theme. <strong>Default</strong> follows your device setting.
                    </p>
                </div>
                <ThemeSettings />
            </section>
        </div>
    );
}
