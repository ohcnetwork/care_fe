import assert from "node:assert/strict";
import path from "node:path";
import { test } from "node:test";

import { compile } from "@tailwindcss/node";
import { loadConfigFromFile, type Plugin, type ResolvedConfig } from "vite";

test("local plugin CSS retains Tailwind theme references without emitting a reset", async () => {
  const root = process.cwd();
  const config = await loadConfigFromFile(
    { command: "serve", mode: "development" },
    path.join(root, "vite.config.mts"),
  );
  const plugin = config?.config.plugins
    ?.flat()
    .find(
      (candidate) =>
        candidate &&
        "name" in candidate &&
        candidate.name === "local-plugin-dev-support",
    ) as Plugin;
  assert.ok(plugin);
  assert.equal(typeof plugin.configResolved, "function");
  assert.equal(typeof plugin.transform, "function");
  if (
    typeof plugin.configResolved !== "function" ||
    typeof plugin.transform !== "function"
  )
    return;
  await plugin.configResolved.call(
    {} as never,
    { root, command: "serve" } as ResolvedConfig,
  );
  const css = `@import "tailwindcss";
    @utility hit-area-* { margin: --spacing(--value(number) * -1); }
    .plugin-control { @apply p-2 hit-area-2; }`;
  const transformed = await plugin.transform.call(
    {} as never,
    css,
    path.join(root, "apps/example/src/style/index.css"),
  );
  assert.equal(typeof transformed, "string");
  if (typeof transformed !== "string") return;
  const compiler = await compile(transformed, {
    base: root,
    onDependency() {},
  });
  const output = compiler.build(["hit-area-2"]);
  assert.match(output, /padding: calc\(var\(--spacing(?:, 0\.25rem)?\) \* 2\)/);
  assert.match(
    output,
    /margin: calc\(var\(--spacing(?:, 0\.25rem)?\) \* 2 \* -1\)/,
  );
  assert.doesNotMatch(output, /box-sizing: border-box/);
  assert.doesNotMatch(output, /--spacing:\s*0\.25rem/);
});
