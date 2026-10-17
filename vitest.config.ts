import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Override the project's PostCSS (Tailwind v4) config so Vite doesn't try
    // to load it for unit tests — these run in a plain Node environment.
    css: { postcss: { plugins: [] } },
    test: {
        environment: 'node',
        include: ['**/*.test.ts'],
        exclude: ['node_modules', '.next', 'cron-worker'],
    },
});
