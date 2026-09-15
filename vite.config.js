import { resolve } from 'node:path';
import { defineConfig } from 'vite';

// Relative base so the same build works from a domain root and from a
// GitHub Pages project subpath (/edu-games/) without reconfiguration.
export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        menu: resolve(import.meta.dirname, 'index.html'),
        math: resolve(import.meta.dirname, 'math.html'),
        reading: resolve(import.meta.dirname, 'reading.html')
      }
    }
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.test.js'],
    coverage: { provider: 'v8', include: ['src/**/*.js'] }
  }
});
