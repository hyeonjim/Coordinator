import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: "window",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://i14e205.p.ssafy.io:8081",
        changeOrigin: true,
      },
      "/oauth2": {
        target: "http://i14e205.p.ssafy.io:8081",
        changeOrigin: true,
      },
      "/ws-chat": {
        target: "http://i14e205.p.ssafy.io:8081",
        ws: true,
      },
      "/ws-voice": {
        target: "http://i14e205.p.ssafy.io:8081",
        ws: true,
      },
      "/ws": {
        target: "http://i14e205.p.ssafy.io:8081",
        ws: true,
      },
    },
  },
});
