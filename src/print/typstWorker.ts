/// <reference lib="webworker" />
import {
  type TypstCompiler,
  createTypstCompiler,
} from "@myriaddreamin/typst.ts/compiler";
import {
  disableDefaultFontAssets,
  loadFonts,
} from "@myriaddreamin/typst.ts/options.init";
import {
  type TypstRenderer,
  createTypstRenderer,
} from "@myriaddreamin/typst.ts/renderer";
import type { WebAssemblyModuleRef } from "@myriaddreamin/typst.ts/wasm";

import { buildPrintHtml } from "@/print/printHtml";
import type { PrintDocument } from "@/print/types";

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
  /** Turns a compiled document into SVG; loaded on first use. */
  rendererUrl: string;
  fontUrls: string[];
}

export interface TypstCompileRequest {
  /** Name of a file in `src/print/templates`, without `.typ`. */
  template: string;
  /** Available to the template as `/data.json`. */
  data: PrintDocument<unknown>;
  theme: Record<string, string>;
  /** Extra files (e.g. images) by virtual path. */
  files: Record<string, Uint8Array>;
  /** Also build the document that desktop browsers print (see printHtml.ts). */
  printHtml: boolean;
}

export interface TypstOutput {
  pdf: Uint8Array;
  /** Missing if not asked for, or if it couldn't be built: print the PDF. */
  printHtml?: string;
}

export interface TypstWorkerRequest {
  id: number;
  assets: TypstAssets;
  request: TypstCompileRequest;
}

export type TypstWorkerResponse =
  | ({ id: number } & TypstOutput)
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

async function createRenderer(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load ${url}: HTTP ${response.status}`);
  }
  const renderer = createTypstRenderer();
  await renderer.init({
    getModule: () =>
      ({ module_or_path: response }) as unknown as WebAssemblyModuleRef,
  });
  return renderer;
}

let compiler: Promise<TypstCompiler> | undefined;
let renderer: Promise<TypstRenderer> | undefined;

/** `vector` is the compiled document in typst.ts's own format. */
async function renderPrintHtml(
  assets: TypstAssets,
  vector: Uint8Array,
  { layout }: PrintDocument<unknown>,
) {
  renderer ??= createRenderer(assets.rendererUrl).catch((error) => {
    renderer = undefined; // Let the next request retry.
    throw error;
  });
  const typst = await renderer;

  return typst.runWithSession(async (session) => {
    typst.manipulateData({
      renderSession: session,
      action: "reset",
      data: vector,
    });
    return buildPrintHtml({
      svg: await typst.renderSvg({
        renderSession: session,
        // The script is for on-screen interaction (hover, jump to source).
        data_selection: { body: true, defs: true, css: true, js: false },
      }),
      pages: typst
        .retrievePagesInfoFromSession(session)
        .map(({ width, height }) => ({ width, height })),
      page: layout.page,
      title: layout.title,
    });
  });
}

async function compile(
  assets: TypstAssets,
  { template, data, theme, files, printHtml }: TypstCompileRequest,
): Promise<TypstOutput> {
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
        const pdf = await world.pdf({ diagnostics: "unix" });
        const vector = printHtml
          ? await world.vector({ diagnostics: "unix" })
          : undefined;
        return { ...pdf, vector: vector?.result };
      },
    );

    if (!("result" in result) || !result.result) {
      throw new CompileError(
        `Couldn't compile the ${template} template`,
        result.diagnostics,
      );
    }

    const output: TypstOutput = { pdf: result.result };
    if (result.vector) {
      try {
        output.printHtml = await renderPrintHtml(assets, result.vector, data);
      } catch (error) {
        // The PDF can still be printed, on the paper the print dialog is set to.
        console.warn("Print: couldn't build the print document", error);
      }
    }
    return output;
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
      ({ pdf, printHtml }) => {
        // Copy so the transferred buffer can't be one the compiler still uses.
        const own = pdf.slice();
        const response: TypstWorkerResponse = { id, pdf: own, printHtml };
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
