import { defineConfig } from "vite";
import solid from "vite-plugin-solid";
import UnoCSS from "unocss/vite";

export default defineConfig({
  plugins: [UnoCSS(), solid()],
  build: {
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    proxy: {
      // `/api/events` is a WebSocket upgrade; the rest of `/api` is REST.
      // `ws: true` lets the dev proxy forward the upgrade to the Rust server.
      "/api": { target: "http://127.0.0.1:3000", ws: true },
      "/health": "http://127.0.0.1:3000",
    },
  },
  test: {
    environment: "node",
    globals: true,
  },
});
