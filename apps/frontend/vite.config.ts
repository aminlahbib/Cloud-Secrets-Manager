import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    proxy: {
      '/api/audit': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Only split out large third-party libraries
          // Let Vite handle React bundling automatically to prevent load order issues

          // Recharts (large charting library)
          if (id.includes('node_modules/recharts')) {
            return 'charts-vendor';
          }
          // Firebase (large)
          if (id.includes('node_modules/firebase')) {
            return 'firebase-vendor';
          }
          // Axios
          if (id.includes('node_modules/axios')) {
            return 'axios-vendor';
          }
          // Everything else stays in main vendor chunk
          // This ensures React and its ecosystem load together
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
});

