import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    proxy: {
      // frontend calls fetch("/api/chat"); Vite forwards it to server.mjs
      "/api": {
        target: "http://localhost:8787",
        changeOrigin: true,
      },
    },
  },
});
