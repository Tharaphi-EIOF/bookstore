import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Keep heavy third-party libraries out of the shared app chunk.
        manualChunks(id) {
          if (!id.includes('/node_modules/')) return undefined

          const parts = id.split('/node_modules/')[1]?.split('/') ?? []
          const packageName = parts[0]?.startsWith('@')
            ? `${parts[0]}/${parts[1] ?? ''}`
            : (parts[0] ?? '')

          if (packageName.startsWith('@tiptap/')) return 'editor'
          if (packageName === 'recharts') return 'charts'
          if (packageName === 'framer-motion') return 'motion'
          if (
            packageName === 'react'
            || packageName === 'react-dom'
            || packageName === 'react-router'
            || packageName === 'react-router-dom'
          ) {
            return 'framework'
          }
          if (packageName.startsWith('@tanstack/')) return 'query'
          if (packageName.startsWith('@clerk/')) return 'clerk'
          if (packageName === 'lucide-react') return 'icons'
          if (
            packageName === 'react-hook-form'
            || packageName === '@hookform/resolvers'
            || packageName === 'zod'
          ) {
            return 'forms'
          }
          if (
            packageName === 'axios'
            || packageName === 'clsx'
            || packageName === 'tailwind-merge'
            || packageName === 'zustand'
            || packageName === 'jwt-decode'
            || packageName === 'dompurify'
          ) {
            return 'shared-utils'
          }

          return 'vendor-misc'
        },
      },
    },
  },
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
