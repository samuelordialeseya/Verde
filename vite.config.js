import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const projectId = env.VITE_FIREBASE_PROJECT_ID || "hackathon-technofusion";
  const region = "asia-southeast1";

  return {
    plugins: [react(), tailwindcss()],
    server: {
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
