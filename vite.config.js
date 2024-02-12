import { resolve } from "path";
import { defineConfig } from "vite";
import 'dotenv/config'

export default defineConfig({
  base: process.env.VITE_BASE_PATH,
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        graph: resolve(__dirname, "views/graph/graph.html"),
        detail: resolve(__dirname, "views/detail/detail.html"),
        barchart: resolve(__dirname, "views/barchart/barchart.html"),
      },
    },
  },
});
