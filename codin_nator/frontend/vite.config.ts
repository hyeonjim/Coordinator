import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
    },
  },
});
