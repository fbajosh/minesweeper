import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join, posix, relative, resolve, sep } from "node:path";
import { defineConfig } from "vite";

async function listBuildFiles(directory, rootDirectory = directory) {
  const entries = await readdir(directory);
  const files = [];

  for (const entry of entries) {
    const fullPath = join(directory, entry);
    const fileStat = await stat(fullPath);

    if (fileStat.isDirectory()) {
      files.push(...(await listBuildFiles(fullPath, rootDirectory)));
      continue;
    }

    const relativePath = relative(rootDirectory, fullPath).split(sep).join(posix.sep);
    files.push(`./${relativePath}`);
  }

  return files;
}

function emitStaticAppFiles() {
  let outputDirectory = "";

  return {
    configResolved(config) {
      outputDirectory = resolve(config.root, config.build.outDir);
    },
    name: "emit-static-app-files",
    async writeBundle() {
      const indexHtml = await readFile(resolve(outputDirectory, "index.html"), "utf8");
      await writeFile(resolve(outputDirectory, "404.html"), indexHtml, "utf8");

      const serviceWorkerPath = resolve(outputDirectory, "sw.js");
      const serviceWorker = await readFile(serviceWorkerPath, "utf8");
      const buildVersion = process.env.VITE_BUILD_VERSION?.trim() || String(Date.now());
      const files = await listBuildFiles(outputDirectory);
      const precacheUrls = Array.from(new Set(["./", ...files.filter((file) => file !== "./sw.js")])).sort();
      const patchedServiceWorker = serviceWorker
        .replace("__CACHE_VERSION__", buildVersion)
        .replace("__PRECACHE_URLS__", JSON.stringify(precacheUrls, null, 2));

      await writeFile(serviceWorkerPath, patchedServiceWorker, "utf8");
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [emitStaticAppFiles()],
  root: "src",
  base: command === "build" ? "/minesweeper/" : "/",
  build: {
    emptyOutDir: true,
    outDir: "../dist",
  },
}));
