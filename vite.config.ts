import { defineConfig } from "vite";
import { fresh } from "@fresh/plugin-vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [fresh(), tailwindcss()],
  optimizeDeps: {
    exclude: ["@sqlite.org/sqlite-wasm"],
  },
  assetsInclude: ["**/*.db"],
});
