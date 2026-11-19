/// <reference lib="webworker" />
import {
  type TypstCompiler,
  createTypstCompiler,
} from "@myriaddreamin/typst.ts/compiler";
import {
  disableDefaultFontAssets,
  loadFonts,
} from "@myriaddreamin/typst.ts/options.init";
import type { WebAssemblyModuleRef } from "@myriaddreamin/typst.ts/wasm";

declare const self: DedicatedWorkerGlobalScope;

/** Every .typ file under src/print, at its path relative to src/print. */
const SOURCES = Object.entries(
  import.meta.glob<string>("./**/*.typ", {
    query: "?raw",
    import: "default",
    eager: true,
  }),
).map(([path, source]) => [path.slice(1), source] as const);

export interface TypstAssets {
  compilerUrl: string;
  fontUrls: string[];
}

export interface TypstCompileRequest {
  /** Name of a file in `src/print/templates`, without `.typ`. */
  template: string;
  /** Available to the template as `/data.json`. */
  data: unknown;
  theme: Record<string, string>;
  /** Extra files (e.g. images) by virtual path. */
  files: Record<string, Uint8Array>;
}

export interface TypstWorkerRequest {
  id: number;
  assets: TypstAssets;
  request: TypstCompileRequest;
}

export type TypstWorkerResponse =
  | { id: number; pdf: Uint8Array }
  | { id: number; error: string; diagnostics: string[] };

async function fetchBytes(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function loadCompilerModule(url: string) {
  const bytes = await fetchBytes(url);
  // Production builds ship the compiler gzipped; a CDN may have already
  // decompressed it.
  const gzipped = bytes[0] === 0x1f && bytes[1] === 0x8b;
  const body = gzipped
    ? new Blob([bytes]).stream().pipeThrough(new DecompressionStream("gzip"))
    : bytes;
  return new Response(body, {
    headers: { "Content-Type": "application/wasm" },
  });
}

async function createCompiler(assets: TypstAssets) {
  const [module, fonts] = await Promise.all([
    loadCompilerModule(assets.compilerUrl),
    Promise.all(assets.fontUrls.map(fetchBytes)),
  ]);

  const compiler = createTypstCompiler();
  await compiler.init({
    // The object form avoids a deprecation warning.
    getModule: () =>
      ({ module_or_path: module }) as unknown as WebAssemblyModuleRef,
    beforeBuild: [disableDefaultFontAssets(), loadFonts(fonts)],
  });
  for (const [path, source] of SOURCES) compiler.addSource(path, source);
  return compiler;
}

let compiler: Promise<TypstCompiler> | undefined;

async function compile(
  assets: TypstAssets,
  { template, data, theme, files }: TypstCompileRequest,
): Promise<Uint8Array> {
  const mainFilePath = `/templates/${template}.typ`;
  if (!SOURCES.some(([path]) => path === mainFilePath)) {
    throw new CompileError(`Unknown print template: ${template}`);
  }

  compiler ??= createCompiler(assets).catch((error) => {
    compiler = undefined; // Let the next request retry.
    throw error;
  });
  const typst = await compiler;

  // The files hold patient data: unmap them as soon as this document is done.
  const paths = ["/data.json", ...Object.keys(files)];
  try {
    typst.mapShadow(
      "/data.json",
      new TextEncoder().encode(JSON.stringify(data)),
    );
    for (const [path, bytes] of Object.entries(files)) {
      typst.mapShadow(path, bytes);
    }

    const result = await typst.runWithWorld(
      {
        mainFilePath,
        inputs: { data: "/data.json", theme: JSON.stringify(theme) },
      },
      async (world) => {
        const compiled = await world.compile({ diagnostics: "unix" });
        if (compiled.hasError) return { diagnostics: compiled.diagnostics };
        return world.pdf({ diagnostics: "unix" });
      },
    );

    if (!("result" in result) || !result.result) {
      throw new CompileError(
        `Couldn't compile the ${template} template`,
        result.diagnostics,
      );
    }
    return result.result;
  } finally {
    for (const path of paths) typst.unmapShadow(path);
  }
}

class CompileError extends Error {
  constructor(
    message: string,
    readonly diagnostics: string[] = [],
  ) {
    super(message);
  }
}

// The compiler holds one set of virtual files: compile one document at a time.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = ({ data }: MessageEvent<TypstWorkerRequest>) => {
  const { id, assets, request } = data;
  queue = queue
    .then(() => compile(assets, request))
    .then(
      (pdf) => {
        // Copy so the transferred buffer can't be one the compiler still uses.
        const own = pdf.slice();
        const response: TypstWorkerResponse = { id, pdf: own };
        self.postMessage(response, [own.buffer]);
      },
      (error: unknown) => {
        const response: TypstWorkerResponse = {
          id,
          error: error instanceof Error ? error.message : String(error),
          diagnostics: error instanceof CompileError ? error.diagnostics : [],
        };
        self.postMessage(response);
      },
    );
};
