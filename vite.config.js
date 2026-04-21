import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import legacy from "@vitejs/plugin-legacy";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "hackathon-technofusion";
  const region = "asia-southeast1";

  return {
    base: "/",
    define: {
      global: "globalThis",
    },
    build: {
      target: "es2015",
    },
    plugins: [
      react(), 
      tailwindcss(),
      legacy({
        targets: ["defaults", "not IE 11", "iOS >= 11"],
      }),
    ],
    server: {
      allowedHosts: [".loca.lt"],
      proxy: {
        "/api/verifyEcoAction": {
          target: `https://${region}-${projectId}.cloudfunctions.net`,
          changeOrigin: true,
          secure: true,
          rewrite: () => "/verifyEcoActionHttp",
        },
      },
    },
  };
});

