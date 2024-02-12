import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  base: "/gssi-repository-explorer",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        graph: resolve(__dirname, "graph.html"),
        detail: resolve(__dirname, "detail.html"),
        barchart: resolve(__dirname, "barchart.html"),
      },
    },
  },
});
