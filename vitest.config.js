import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.test.js'],
  },
  esbuild: {
    format: 'esm',
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html', 'lcov', 'text-summary'],
    include: ['src/**/*.js'],
    // No exclude — the entire source is `src/main.js`, and we want it covered.
  },
});
