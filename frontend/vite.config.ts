/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      exclude: ['node_modules/', 'src/test/setup.ts', 'src/vite-env.d.ts', 'dist/'],
    },
  },
  server: {
    proxy: {
      '/auth': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/user': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/url': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      '/shorten': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
