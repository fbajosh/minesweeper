import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { defineConfig } from "vite";

function emitFallbackIndex() {
  let outputDirectory = "";

  return {
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    name: "emit-fallback-index",
    async writeBundle() {
      const indexHtml = await readFile(resolve(outputDirectory, "index.html"), "utf8");
      await writeFile(resolve(outputDirectory, "404.html"), indexHtml, "utf8");
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [emitFallbackIndex()],
  root: "src",
  base: command === "build" ? "/minesweeper/" : "/",
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
}));
