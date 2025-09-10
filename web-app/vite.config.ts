import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { defineConfig } from "vite";
import { visualizer } from 'rollup-plugin-visualizer';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),visualizer()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:3000",
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, "/api"),
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
  }
});
