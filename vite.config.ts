import { existsSync, statSync } from 'node:fs'
import { normalize, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import react from '@vitejs/plugin-react'
import { seedDesignPlugin } from '@seed-design/vite-plugin'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import svgr from 'vite-plugin-svgr'

const rootDir = fileURLToPath(new URL('.', import.meta.url))
const distDir = resolve(rootDir, 'dist')

/** dist에 있는 빌드 산출물은 프리뷰가 직접 제공하고, 없으면 API /assets로 넘긴다. */
function bypassPreviewAsset(req: { url?: string }): string | undefined {
  const pathname = req.url?.split('?')[0]
  if (!pathname?.startsWith('/assets/') || pathname.includes('..')) return
  const filePath = resolve(distDir, normalize(`.${pathname}`))
  if (!filePath.startsWith(`${distDir}${sep}`)) return
  if (existsSync(filePath) && statSync(filePath).isFile()) return pathname
}

// PWA theme_color/background_color: 라이트 모드 --seed-color-bg-layer-default (palette-gray-00) 기준
const PWA_LAYER_DEFAULT = '#ffffff'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr(),
    seedDesignPlugin({
      colorMode: 'light-only',
      fontScaling: true,
      // index.html / index.css에서 color-scheme: light 고정
      injectColorSchemeTag: false,
    }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'icons.svg',
        'app-icons/ios/icon-180x180.png',
        'app-icons/pwa/icon-192x192.png',
        'app-icons/pwa/icon-512x512.png',
        'app-icons/pwa/maskable-icon-512x512.png',
      ],
      manifest: {
        name: 'Brit',
        short_name: 'Brit',
        description: '개인 간 코인 거래',
        theme_color: PWA_LAYER_DEFAULT,
        background_color: PWA_LAYER_DEFAULT,
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'app-icons/pwa/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icons/pwa/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'app-icons/pwa/maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        globIgnores: [
          '**/motion/**',
          '**/apng/**',
          '**/lotties/**',
          '**/brit-bank-mobile-notification*.js',
        ],
        maximumFileSizeToCacheInBytes: 3_000_000,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        navigateFallback: 'index.html',
      },
    }),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/assets': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: ['.ngrok-free.dev'],
    proxy: {
      '/v1': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        ws: true,
      },
      '/assets': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        bypass: bypassPreviewAsset,
      },
    },
  },
})
