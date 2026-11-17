import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { gzipSync } from "node:zlib";
import type { Plugin } from "vite";

const VIRTUAL_ID = "virtual:typst-compiler-wasm";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

/**
 * Exposes the Typst compiler as `virtual:typst-compiler-wasm`. Production
 * builds emit it gzipped (28 MB -> 11 MB, under Cloudflare Pages' 25 MiB file
 * limit); the print worker decompresses it. The dev server serves it raw.
 */
export function typstCompilerWasm(): Plugin {
  const require = createRequire(import.meta.url);
  let isBuild = false;

  return {
    name: "care-typst-compiler-wasm",
    configResolved(config) {
      isBuild = config.command === "build";
    },
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : undefined;
    },
    load(id) {
      if (id !== RESOLVED_ID) return;

      if (!isBuild) {
        return `export { default } from "@myriaddreamin/typst-ts-web-compiler/wasm?url";`;
      }

      const wasm = readFileSync(
        require.resolve("@myriaddreamin/typst-ts-web-compiler/wasm"),
      );
      const referenceId = this.emitFile({
        type: "asset",
        name: "typst-compiler.wasm.gz",
        source: gzipSync(wasm, { level: 9 }),
      });
      return `export default import.meta.ROLLUP_FILE_URL_${referenceId};`;
    },
  };
}
