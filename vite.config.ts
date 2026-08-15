import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// Installable, offline-capable PWA. Workbox precaches the app shell, the
// course JSON, and every MP3 so lessons work with no connection.
export default defineConfig({
  base: "./",
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        globPatterns: ["**/*.{js,css,html,json,woff2,png,mp3}"],
      },
      manifest: {
        name: "کلاس انگلیسی — English for Mom & Dad",
        short_name: "کلاس انگلیسی",
        description: "Learn English step by step, in Farsi.",
        lang: "fa",
        dir: "rtl",
        theme_color: "#1d4ed8",
        background_color: "#faf7f2",
        display: "standalone",
        orientation: "portrait",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
});
