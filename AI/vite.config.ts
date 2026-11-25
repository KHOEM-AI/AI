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

// KI token for the /ki proxy. Read on the server (dev server), never sent to the browser.
function kiToken(): string {
  if (process.env.KI_API_TOKEN) return process.env.KI_API_TOKEN;
  try {
    const f = os.homedir() + "/KI/.env";
    const m = fs.readFileSync(f, "utf8").match(/^\s*(?:export\s+)?KI_API_TOKEN\s*=\s*(.*)$/m);
    return m ? m[1].trim().replace(/^['"]|['"]$/g, "") : "";
  } catch {
    return "";
  }
}

// IQ-AI token for the /iqai proxy. Read on the server (dev server), never sent to the browser.
// Order: env IQAI_TOKEN, then ~/IQ-AI/.env, then ~/.iqai-token (same file docs/TERMUX.md creates).
function iqaiToken(): string {
  if (process.env.IQAI_TOKEN) return process.env.IQAI_TOKEN;
  const clean = (v: string) => v.trim().replace(/^['"]|['"]$/g, "");
  try {
    const f = os.homedir() + "/IQ-AI/.env";
    const m = fs.readFileSync(f, "utf8").match(/^\s*(?:export\s+)?IQAI_TOKEN\s*=\s*(.*)$/m);
    if (m && clean(m[1])) return clean(m[1]);
  } catch {
    /* fall through */
  }
  try {
    return clean(fs.readFileSync(os.homedir() + "/.iqai-token", "utf8"));
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
          Authorization: `Bearer ${iqaiToken()}`,
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

      // KI central API (own service, port 5001); the token is added here
      "^/ki/": {
        target: "http://127.0.0.1:5001",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/ki/, ""),
        headers: { "x-ki-token": kiToken() },
      },

      // AI Backend
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: true,
      },
    },
  },
});
