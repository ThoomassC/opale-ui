import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    // `css: true` is not cosmetic here: with `css: false`, Vite stubs CSS
    // modules out and `import sheet from './x.css?raw'` returns an empty
    // string — the colour contract would then pass by reading nothing at all.
    css: true,
    // Les worktrees de `.claude/` sont des copies du dépôt : sans cette
    // exclusion, `vitest run` rejoue la suite une fois par copie.
    exclude: ['**/node_modules/**', '**/dist/**', '.claude/**'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/test/**', 'src/showcase/**', 'src/vite-env.d.ts'],
    },
  },
});
