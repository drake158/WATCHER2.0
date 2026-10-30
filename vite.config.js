import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js']
  }
});
