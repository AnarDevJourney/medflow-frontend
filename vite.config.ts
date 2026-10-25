import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

const alias = (dir: string) => path.resolve(import.meta.dirname, "src", dir);

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const gateway = env.VITE_GATEWAY_URL || "http://localhost:3000";

  return {
    plugins: [react()],
    resolve: {
      // Keep in sync with "paths" in tsconfig.app.json
      alias: {
        "@components": alias("components"),
        "@features": alias("features"),
        "@hooks": alias("hooks"),
        "@lib": alias("lib"),
        "@router": alias("router"),
        "@store": alias("store"),
        "@styles": alias("styles"),
        "@models": alias("types"),
        "@utils": alias("utils"),
        // the DataTable package, built here until it is published to npm
        tablesync: alias("packages/tablesync/index.ts"),
      },
    },
    server: {
      port: 5173,
      strictPort: true, // invite / reset links in emails point to :5173
      // The browser only ever talks to the Vite origin: API calls and the
      // Socket.io connection are proxied to the gateway, so the auth cookies
      // are same-origin (no CORS, SameSite=Lax just works).
      proxy: {
        "/api": { target: gateway, changeOrigin: true },
        "/socket.io": { target: gateway, changeOrigin: true, ws: true },
      },
    },
  };
});
