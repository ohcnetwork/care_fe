import assert from "node:assert/strict";
import { test } from "node:test";

import federation from "@originjs/vite-plugin-federation";
import { type Plugin, parseSync } from "vite";

import { federationHostBuild } from "./federationHostBuild.js";

function handler<T extends (...args: never[]) => unknown>(
  hook: T | { handler: T } | undefined,
): T {
  assert.ok(hook);
  return typeof hook === "object" ? hook.handler : hook;
}

// A production-mode host plugin, configured the way vite.config.mts does.
function hostPlugin() {
  const plugin = federation({
    name: "core",
    remotes: { dummy: "" },
    shared: ["react"],
  }) as Plugin;
  handler(plugin.config).call(
    {} as never,
    {},
    { mode: "production", command: "build" },
  );
  return plugin;
}

function pluginContext() {
  const emitted: string[] = [];
  return {
    emitted,
    context: {
      parse: (code: string) => parseSync("module.js", code).program,
      emitFile: (file: { name: string }) => {
        emitted.push(file.name);
        return `ref-${emitted.length}`;
      },
    } as never,
  };
}

async function transform(plugin: Plugin, code: string, id: string) {
  const { context, emitted } = pluginContext();
  const result = await handler(plugin.transform).call(context, code, id, {
    moduleType: "js",
  });
  const out =
    result && typeof result === "object" && "code" in result
      ? result.code
      : result;
  return { code: out, emitted };
}

const hostModule = `import React, { useState } from "react";\nexport const x = [React, useState];\n`;

test("the unwrapped plugin rewrites shared imports into top-level await", async () => {
  const { code } = await transform(hostPlugin(), hostModule, "/src/App.tsx");
  assert.match(String(code), /await importShared\('react'\)/);
});

test("host modules keep their static imports of shared packages", async () => {
  const plugin = federationHostBuild(hostPlugin(), ["dummy"]);
  const { code, emitted } = await transform(plugin, hostModule, "/src/App.tsx");
  assert.equal(code, null);
  // The shared chunk that remotes import is still emitted.
  assert.deepEqual(emitted, ["__federation_shared_react"]);
});

test("the shared chunks are emitted only once", async () => {
  const plugin = federationHostBuild(hostPlugin(), ["dummy"]);
  const { context, emitted } = pluginContext();
  const run = handler(plugin.transform);
  await run.call(context, hostModule, "/src/A.tsx", { moduleType: "js" });
  await run.call(context, hostModule, "/src/B.tsx", { moduleType: "js" });
  assert.deepEqual(emitted, ["__federation_shared_react"]);
});

test("imports from a remote are still rewritten", async () => {
  const plugin = federationHostBuild(hostPlugin(), ["dummy"]);
  const { code } = await transform(
    plugin,
    `const m = import("dummy/manifest");\n`,
    "/src/Remote.tsx",
  );
  assert.match(String(code), /__federation_method_getRemote\("dummy"/);
});

test("the share scope in the federation virtual module is still filled in", async () => {
  const plugin = federationHostBuild(hostPlugin(), ["dummy"]);
  const { code } = await transform(
    plugin,
    `const wrapShareModule = () => ({ __rf_placeholder__shareScope });\n`,
    "\0virtual:__federation__",
  );
  // (The version is read from package.json in buildStart, not run here.)
  assert.match(
    String(code),
    /'react':\{'[^']+':\{get:\(\)=>get\(import\.meta\.ROLLUP_FILE_URL_ref-1/,
  );
});

test("the plugin's manualChunks is dropped only when codeSplitting is set", () => {
  const plugin = federationHostBuild(hostPlugin(), ["dummy"]);
  const outputOptions = handler(plugin.outputOptions);

  const grouped = outputOptions.call({} as never, {
    codeSplitting: { groups: [] },
  }) as { manualChunks?: unknown };
  assert.equal(grouped.manualChunks, undefined);

  const plain = outputOptions.call({} as never, {}) as {
    manualChunks?: unknown;
  };
  assert.equal(typeof plain.manualChunks, "function");
});
