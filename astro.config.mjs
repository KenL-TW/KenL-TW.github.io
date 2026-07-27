import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  site: "https://ken-personal-page.digitalaaronl.workers.dev",
  integrations: [react()],
  build: {
    assets: "_assets"
  },
  vite: {
    build: {
      sourcemap: false
    }
  }
});
