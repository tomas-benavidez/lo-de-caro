import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

  return {
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(supabaseUrl),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(supabaseAnonKey),
    },
    plugins: [

    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logos/png rojo.svg", "personajes/personaje_principal.png"],
      manifest: {
        name: "Lo de Caro - Gestión Gastronómica",
        short_name: "Lo de Caro",
        description: "Control de recetas, producción, ventas y stock de comida casera congelada",
        theme_color: "#A6613A",
        background_color: "#F8F7E1",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        icons: [
          {
            src: "/logos/png rojo.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/logos/png rojo.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          supabase: ["@supabase/supabase-js"],
        },
      },
    },
  },
    test: {
      globals: true,
      environment: "node",
    },
  };
});

