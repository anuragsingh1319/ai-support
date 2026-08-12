import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Output a single self-contained JS bundle (IIFE format)
    lib: {
      entry: './src/main.jsx',
      name: 'AISupportWidget',
      fileName: 'widget',
      formats: ['iife'],
    },
    rollupOptions: {
      // Inline React into the bundle so the host page doesn't need it
      external: [],
    },
    outDir: 'dist',
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  },
})
