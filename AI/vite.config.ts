import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import os from "node:os";

// Read gateway secret server-side only.
function gatewayToken(): string {
  if (process.env.GATEWAY_TOKEN) return process.env.GATEWAY_TOKEN;

  try {
    const f = os.homedir() + "/KSV/gateway/.env";
    const m = fs.readFileSync(f, "utf8").match(
      /^\s*(?:export\s+)?GATEWAY_TOKEN\s*=\s*(.*)$/m
    );

    return m ? m[1].trim().replace(/^['"]|['"]$/g, "") : "";
  } catch {
    return "";
  }
}

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

      // IQ-AI media service
      "/iqai": {
        target: "http://127.0.0.1:8799",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/iqai/, "/api/v1"),
        headers: {
          Authorization: `Bearer ${process.env.IQAI_TOKEN ?? ""}`,
        },
      },

      // Central Intelligence Data Core
      "/cidc": {
        target: "http://127.0.0.1:5190",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/cidc/, ""),
      },

      // KSV Gateway
      "/ksv-api": {
        target: "http://127.0.0.1:4000",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ksv-api/, "/api/ksv"),
        headers: {
          "x-gateway-token": gatewayToken(),
        },
      },

      // Generated voice files (served by the AI backend)
      "/audio": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },

      // AI Backend
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
