import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      "/l10n": {
        target: "http://127.0.0.1:8790",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/l10n/, ""),
      },
      // IQ-AI media service: /iqai/media -> http://127.0.0.1:8799/api/v1/media
      // Token is added here (server side) so the browser never sees it.
      "/iqai": {
        target: "http://127.0.0.1:8799",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/iqai/, "/api/v1"),
        headers: { Authorization: `Bearer ${process.env.IQAI_TOKEN ?? ""}` },
      },
      // frontend calls fetch("/api/chat"); Vite forwards it to server.mjs
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
