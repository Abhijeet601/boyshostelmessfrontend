import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (/recharts|d3-|victory-vendor/.test(id)) return "charts";
            if (/framer-motion|motion-dom|motion-utils/.test(id))
              return "motion";
            if (id.includes("html5-qrcode")) return "scanner";
          }
        },
      },
    },
  },
});
