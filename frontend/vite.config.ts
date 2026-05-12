import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  /**
   * 🔥 IMPORTANTE:
   * - "/" = Vercel + produção web correta
   * - "./" = Capacitor (mobile local)
   *
   * 👉 SOLUÇÃO PROFISSIONAL: usar "/" e deixar Capacitor resolver via config dele
   */
  base: "/",

  plugins: [react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    host: "::",
    port: 8082,
    hmr: {
      overlay: false,
    },
  },

  build: {
    outDir: "dist",

    // 🔥 evita bugs de chunk grande no Vercel
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
        },
      },
    },
  },
});