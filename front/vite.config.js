import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: './', // ton dossier front
  build: {
    outDir: resolve(__dirname, '../public/front'),
    emptyOutDir: true,
  },
  server: {
    host: true,          // équivalent à 0.0.0.0
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://host.docker.internal:8000',
        changeOrigin: true,
        secure: false,
      },
      '/apip': {
        target: 'http://host.docker.internal:8000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
