import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5174,
  },
  esbuild: {
    // Remove console statements in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  build: {
    // Code splitting for better performance
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'sonner'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          'editor-vendor': ['react-quill', 'quill'],
          'chart-vendor': ['recharts'],
        },
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification (use esbuild for faster builds, terser for better compression)
    minify: 'esbuild', // Changed from terser to esbuild for faster builds
    // Source maps for production debugging
    sourcemap: mode === 'production' ? 'hidden' : true,
  },
}))

