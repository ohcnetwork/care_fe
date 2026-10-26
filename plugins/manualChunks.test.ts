import assert from "node:assert/strict";
import { test } from "node:test";
import { build } from "vite";

import { explicitManualChunks, manualChunks } from "./manualChunks.js";

test("heavy vendors have separate chunks, including PDF viewing and export", () => {
  const cases = [
    ["recharts/es6/index.js", "vendor-charts"],
    ["reactflow/dist/esm/index.js", "vendor-flow"],
    ["@reactflow/core/dist/esm/index.js", "vendor-flow"],
    ["react-pdf/dist/index.js", "vendor-pdf-viewer"],
    ["pdfjs-dist/build/pdf.mjs", "vendor-pdf-viewer"],
    ["jspdf/dist/jspdf.es.min.js", "vendor-pdf-export"],
    ["fhirpath/src/fhirpath.js", "vendor-fhirpath"],
    ["framer-motion/dist/es/index.mjs", "vendor-motion"],
    ["motion-dom/dist/es/index.mjs", "vendor-motion"],
    ["motion-utils/dist/es/index.mjs", "vendor-motion"],
  ];

  for (const [path, chunk] of cases) {
    assert.equal(manualChunks(`/app/node_modules/${path}`), chunk);
    assert.equal(manualChunks(`C:\\app\\node_modules\\${path}`), chunk);
  }
});

test("shared dependencies and federation virtual modules remain unassigned", () => {
  for (const pkg of [
    "react",
    "react-dom",
    "react-i18next",
    "@tanstack/react-query",
    "raviger",
    "sonner",
    "decimal.js",
  ]) {
    assert.equal(manualChunks(`/app/node_modules/${pkg}/index.js`), undefined);
  }
  assert.equal(manualChunks("\0virtual:__federation__"), undefined);
  assert.equal(manualChunks("\0/app/node_modules/jspdf/index.js"), undefined);
});

test("application files and similarly named packages remain unassigned", () => {
  assert.equal(manualChunks("/app/src/pages/recharts/index.tsx"), undefined);
  assert.equal(
    manualChunks("/app/node_modules/recharts-extra/index.js"),
    undefined,
  );
  assert.equal(manualChunks("/app/node_modules/react/index.js"), undefined);
});

test("vendor splitting preserves federation chunks without capturing shared helpers", async () => {
  const modules: Record<string, string> = {
    "/entry.js":
      'import { shared } from "/shared.js"; globalThis.shared = shared; globalThis.load = () => import("/node_modules/recharts/index.js");',
    "/shared.js": "export const shared = Math.random();",
    "/node_modules/react/index.js": "export const react = Math.random();",
    "/node_modules/recharts/index.js":
      'import { shared } from "/shared.js"; import { react } from "/node_modules/react/index.js"; export const chart = shared + react;',
  };
  const result = await build({
    configFile: false,
    publicDir: false,
    logLevel: "silent",
    plugins: [
      {
        name: "chunk-fixture",
        enforce: "pre",
        resolveId: (id) => (id in modules ? id : undefined),
        load: (id) => modules[id],
        outputOptions(options) {
          const classify = options.manualChunks;
          assert.equal(typeof classify, "function");
          if (typeof classify !== "function") return;
          // Model federation reserving its shared dependencies first.
          options.manualChunks = (id, context) =>
            id === "/node_modules/react/index.js"
              ? "federation-react"
              : classify(id, context);
          return options;
        },
      },
      explicitManualChunks(),
    ],
    build: {
      write: false,
      minify: false,
      rollupOptions: { input: "/entry.js", output: { manualChunks } },
    },
  });
  assert.ok(!Array.isArray(result) && "output" in result);
  const chunks = result.output.filter((output) => output.type === "chunk");
  const charts = chunks.find((chunk) => chunk.name === "vendor-charts");
  const react = chunks.find((chunk) => chunk.name === "federation-react");
  const entry = chunks.find((chunk) => chunk.isEntry);

  assert.ok(
    charts && react && entry,
    JSON.stringify(chunks.map(({ name, modules }) => ({ name, modules }))),
  );
  assert.ok("/node_modules/recharts/index.js" in charts.modules);
  assert.ok(!("/shared.js" in charts.modules));
  assert.ok(!("/node_modules/react/index.js" in charts.modules));
  assert.deepEqual(Object.keys(react.modules), [
    "/node_modules/react/index.js",
  ]);
  assert.ok(!entry.imports.includes(charts.fileName));
  assert.ok(entry.dynamicImports.length > 0);
});
