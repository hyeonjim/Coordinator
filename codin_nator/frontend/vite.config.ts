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
    host: true, // 모든 호스트 허용 (ngrok 접속 가능)
    allowedHosts: [
      "dolefully-nativistic-claudia.ngrok-free.dev",
      ".ngrok-free.dev", // 모든 ngrok 도메인 허용
    ],
    // ngrok 사용 시 프록시 비활성화 (프론트엔드에서 직접 백엔드 ngrok URL로 요청)
    // proxy: {
    //   "/api": {
    //     target: "http://localhost:8080",
    //     changeOrigin: true,
    //   },
    //   "/oauth2": {
    //     target: "http://localhost:8080",
    //     changeOrigin: true,
    //   },
    // },
  },
});
