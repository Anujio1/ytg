import { defineConfig, PluginOption } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import autoprefixer from 'autoprefixer';
import { resolve } from 'path';
import { readdirSync } from 'fs';

export default defineConfig(({ command, mode }) => ({
  define: {
    Locales: readdirSync(resolve(__dirname, './src/locales')).map(file => file.slice(0, 2)),
    Build: JSON.stringify("v7x8 Jun 25")
  },
  server: {
    host: true, // Listen on all network interfaces
    port: 5173, // Explicit port declaration
    strictPort: true, // Don't try other ports if 3000 is taken
    hmr: {
      clientPort: 443 // For secure WebSocket connection through tunnel
    },
    allowedHosts: [
      'dependent-losses-hunter-served.trycloudflare.com', // Your Cloudflare Tunnel URL
      'localhost' // For local development
    ]
  },
  preview: {
    port: 3000,
    strictPort: true
  },
  plugins: [
    injectEruda(command === 'serve' && mode !== 'production'),
    VitePWA({
      manifest: {
        short_name: "SounDroid",
        name: "Listen with SounDroid",
        description: "32kb/s to 128kb/s youtube audio streaming website. Copy a youtube video link and listen to it as an audio totally free.",
        icons: [
          {
            src: "logo192.png",
            type: "image/png",
            sizes: "192x192",
            purpose: "any maskable"
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "512x512",
            purpose: "any maskable"
          },
          {
            src: "logo512.png",
            type: "image/png",
            sizes: "44x44",
            purpose: "any"
          }
        ],
        shortcuts: [
          {
            name: "History",
            url: "/list?collection=history",
            icons: [{
              src: "memories-fill.png",
              sizes: "192x192"
            }]
          },
          {
            name: "Favorites",
            url: "/list?collection=favorites",
            icons: [{
              src: "heart-fill.png",
              sizes: "192x192"
            }]
          },
          {
            name: "Listen Later",
            url: "/list?collection=listenLater",
            icons: [{
              src: "calendar-schedule-fill.png",
              sizes: "192x192"
            }]
          }
        ],
        start_url: "/",
        display: "standalone",
        theme_color: "white",
        background_color: "white",
        share_target: {
          action: "/",
          method: "GET",
          params: {
            title: "title",
            text: "text",
            url: "url"
          }
        }
      },
      disable: command !== 'build',
      includeAssets: ['*.woff2', 'ytify_banner.webp'],
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024 // 10MB
      }
    })
  ],
  css: {
    postcss: {
      plugins: [autoprefixer()]
    }
  },
  build: {
    chunkSizeWarningLimit: 1500 // Increase chunk size warning limit
  }
}));

const injectEruda = (shouldInject: boolean): PluginOption => {
  if (!shouldInject) return [];
  
  return {
    name: 'erudaInjector',
    transformIndexHtml: html => ({
      html,
      tags: [
        {
          tag: 'script',
          attrs: { src: '/node_modules/eruda/eruda.js' },
          injectTo: 'body-prepend'
        },
        {
          tag: 'script',
          injectTo: 'body-prepend',
          children: 'eruda.init(); console.log("Eruda debugger enabled");'
        }
      ]
    })
  };
};