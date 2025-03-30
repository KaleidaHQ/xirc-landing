import { defineConfig } from "astro/config";

import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  output: "static", // Static site generation
  adapter: cloudflare(),
});