import compilerUrl from "virtual:typst-compiler-wasm";

import type {
  TypstAssets,
  TypstCompileRequest,
  TypstWorkerRequest,
  TypstWorkerResponse,
} from "@/print/typstWorker";

const ASSETS: TypstAssets = {
  compilerUrl,
  fontUrls: Object.values(
    import.meta.glob<string>("./fonts/*.ttf", {
      query: "?url",
      import: "default",
      eager: true,
    }),
  ),
};

export class TypstCompileError extends Error {
  constructor(
    message: string,
    /** Compiler diagnostics, e.g. `/templates/invoice.typ:12:3: error: ...` */
    readonly diagnostics: string[] = [],
  ) {
    super(message);
    this.name = "TypstCompileError";
  }
}

interface Pending {
  resolve: (pdf: Uint8Array) => void;
  reject: (error: Error) => void;
}

let worker: Worker | undefined;
let nextId = 0;
const pending = new Map<number, Pending>();

function getWorker() {
  if (worker) return worker;

  worker = new Worker(new URL("./typstWorker.ts", import.meta.url), {
    type: "module",
    name: "typst-print",
  });
  worker.onmessage = ({ data }: MessageEvent<TypstWorkerResponse>) => {
    const request = pending.get(data.id);
    if (!request) return;
    pending.delete(data.id);
    if ("pdf" in data) request.resolve(data.pdf);
    else request.reject(new TypstCompileError(data.error, data.diagnostics));
  };
  worker.onerror = (event) => {
    // The worker itself failed: fail everything in flight and start a new one.
    console.error("Print worker error", event);
    const error = new TypstCompileError(
      event.message || "The print worker stopped unexpectedly",
      event.filename ? [`${event.filename}:${event.lineno}`] : [],
    );
    for (const request of pending.values()) request.reject(error);
    pending.clear();
    worker?.terminate();
    worker = undefined;
  };
  return worker;
}

/** Compiles a print template to a PDF in a web worker; later calls reuse it. */
export function compileTypstPdf(
  request: TypstCompileRequest,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const id = nextId++;
    pending.set(id, { resolve, reject });
    const message: TypstWorkerRequest = { id, assets: ASSETS, request };
    getWorker().postMessage(message);
  });
}
