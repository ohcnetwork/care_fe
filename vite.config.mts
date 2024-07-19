import { VitePWA } from "vite-plugin-pwa";
import react from "@vitejs/plugin-react-swc";
import checker from "vite-plugin-checker";
import { treeShakeCareIcons } from "./plugins/treeShakeCareIcons";

const cdnUrls =
  process.env.CARE_CDN_URL ??
  [
    "https://egov-s3-facility-10bedicu.s3.amazonaws.com",
    "https://egov-s3-patient-data-10bedicu.s3.amazonaws.com",
    "http://localhost:4566",
  ].join(" ");

/** @type {import('vite').UserConfig} */
export default {
  envPrefix: "REACT_",
  plugins: [
    react(),
    checker({ typescript: true }),
    treeShakeCareIcons({
      iconWhitelist: ["default"],
    }),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "service-worker.ts",
      injectRegister: "script-defer",
      devOptions: {
        enabled: true,
        type: "module",
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 7000000,
      },
      manifest: {
        name: "Care",
        short_name: "Care",
        theme_color: "#0e9f6e",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "images/icons/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "images/icons/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "images/icons/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  build: {
    outDir: "build",
    assetsDir: "bundle",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return "vendor";
          }
        },
      },
    },
  },
  server: {
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
  preview: {
    headers: {
      "Content-Security-Policy-Report-Only": `default-src 'self';\
      script-src 'self' blob: 'nonce-f51b9742' https://plausible.10bedicu.in;\
      style-src 'self' 'unsafe-inline';\
      connect-src 'self' https://plausible.10bedicu.in;\
      img-src 'self' https://cdn.coronasafe.network ${cdnUrls};\
      object-src 'self' ${cdnUrls};`,
    },
    port: 4000,
    proxy: {
      "/api": {
        target: process.env.CARE_API ?? "https://careapi.ohc.network",
        changeOrigin: true,
      },
    },
  },
};
