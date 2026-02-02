import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // SockJS 클라이언트를 위한 Node.js 전역 객체 폴리필
  define: {
    global: "globalThis", // ← 이 줄 추가!
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      "/oauth2": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
});
