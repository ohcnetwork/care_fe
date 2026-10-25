import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { test } from "node:test";
import { runInNewContext } from "node:vm";

import { type ReactElement, isValidElement } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";
import type { ResolvedConfig } from "vite";

import { autoRegisterComponents } from "./autoRegisterComponents.js";

function handler<T extends (...args: never[]) => unknown>(
  hook: T | { handler: T } | undefined,
): T {
  assert.ok(hook);
  return typeof hook === "object" ? hook.handler : hook;
}

async function configuredPlugin(
  root: string,
  include?: ReadonlySet<string> | null,
) {
  const plugin = autoRegisterComponents({ include });
  await handler(plugin.configResolved).call(
    {} as never,
    { root } as ResolvedConfig,
  );
  return plugin;
}

async function transform(source: string, include?: ReadonlySet<string> | null) {
  const root = path.resolve("component-fixture");
  const plugin = await configuredPlugin(root, include);
  return handler(plugin.transform).call(
    {} as never,
    source,
    path.join(root, "src/components/Fixture.tsx"),
  );
}

function evaluateModule(result: Awaited<ReturnType<typeof transform>>) {
  assert.ok(result);
  const code = typeof result === "string" ? result : result.code;
  assert.ok(code);
  type Component = (props?: { depth: number }) => ReactElement;
  const registrations: {
    name: string;
    base: Component;
    registered: () => null;
  }[] = [];
  const exports: Record<string, unknown> = {};
  const compiled = ts.transpileModule(code.toString(), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: "Fixture.tsx",
  });
  runInNewContext(compiled.outputText, {
    exports,
    require(specifier: string) {
      if (specifier === "react/jsx-runtime") return jsxRuntime;
      assert.equal(specifier, "@/lib/override");
      return {
        register(name: string, base: Component) {
          const registered = () => null;
          registrations.push({ name, base, registered });
          return registered;
        },
      };
    },
  });
  return { exports, registrations };
}

async function validateTree(
  files: Record<string, string>,
  include?: ReadonlySet<string> | null,
) {
  const root = mkdtempSync(path.join(tmpdir(), "care-component-registration-"));
  try {
    for (const [name, source] of Object.entries(files)) {
      const filename = path.join(root, "src", name);
      mkdirSync(path.dirname(filename), { recursive: true });
      writeFileSync(filename, source);
    }
    const plugin = await configuredPlugin(root, include);
    await handler(plugin.buildStart).call({} as never, {} as never);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

for (const { source, name, exported, include } of [
  {
    source: "export function Foo() { return <div/>; }",
    name: "Foo",
    exported: "Foo",
    include: null,
  },
  {
    source: "export const Bar = () => <div/>;",
    name: "Bar",
    exported: "Bar",
    include: undefined,
  },
  {
    source: "function Baz() { return <div/>; }\nexport default Baz;",
    name: "Baz",
    exported: "default",
    include: undefined,
  },
]) {
  test(`${name} exports the registered wrapper and preserves its implementation`, async () => {
    const { exports, registrations } = evaluateModule(
      await transform(source, include),
    );
    assert.equal(registrations.length, 1);
    const registration = registrations[0];
    assert.equal(registration.name, name);
    assert.equal(exports[exported], registration.registered);
    const rendered = registration.base();
    assert.ok(isValidElement(rendered));
    assert.equal(rendered.type, "div");
  });
}

test("recursive JSX keeps referring to the original implementation", async () => {
  const { exports, registrations } = evaluateModule(
    await transform(
      "export function Tree({ depth }) { return depth ? <Tree depth={depth - 1}/> : <span/>; }",
    ),
  );
  assert.equal(registrations.length, 1);
  const { base, registered } = registrations[0];
  assert.equal(exports.Tree, registered);
  const child = base({ depth: 1 });
  assert.ok(isValidElement<{ depth: number }>(child));
  assert.equal(child.type, base);
  assert.equal(child.props.depth, 0);
  assert.equal(base({ depth: 0 }).type, "span");
});

test("unsupported exports and lowercase functions are left unchanged", async () => {
  for (const source of [
    "function Foo() { return <div/>; }\nexport { Foo };",
    "function X() { return <div/>; }\nexport { X as Y };",
    "export const A = () => <div/>, B = () => <div/>;",
    "export const Ref = forwardRef((p, ref) => <div ref={ref}/>);",
    // JSX is present, so this exercises the lowercase exclusion alone.
    "export function notComp() { return <div/>; }",
  ]) {
    assert.equal(await transform(source), null, source);
  }
});

test("the allowlist registers only selected exports", async () => {
  const { exports, registrations } = evaluateModule(
    await transform(
      "export function Keep() { return <div/>; }\nexport function Drop() { return <span/>; }",
      new Set(["Keep"]),
    ),
  );
  assert.equal(registrations.length, 1);
  assert.equal(registrations[0].name, "Keep");
  assert.equal(exports.Keep, registrations[0].registered);
  assert.equal(typeof exports.Drop, "function");
  const dropped = (exports.Drop as () => ReactElement)();
  assert.ok(isValidElement(dropped));
  assert.equal(dropped.type, "span");
});

test("build startup rejects duplicate registration names across source files", async () => {
  await assert.rejects(
    validateTree({
      "a.tsx": "export function Foo() { return <div/>; }",
      "nested/b.tsx": "export const Foo = () => <span/>;",
    }),
    /Duplicate exported component names[\s\S]*Foo[\s\S]*a\.tsx[\s\S]*b\.tsx/,
  );
});

test("build startup accepts unique names and an unrestricted registration set", async () => {
  await assert.doesNotReject(
    validateTree(
      {
        "a.tsx": "export function Foo() { return <div/>; }",
        "b.tsx": "export const Bar = () => <span/>;",
        "legacy.tsx":
          "function Legacy() { return <div/>; }\nexport { Legacy };",
      },
      null,
    ),
  );
});

test("build startup explains unsupported allowlisted exports", async () => {
  for (const source of [
    "function Foo() { return <div/>; }\nexport { Foo };",
    "function X() { return <div/>; }\nexport { X as Foo };",
  ]) {
    await assert.rejects(
      validateTree({ "a.tsx": source }, new Set(["Foo"])),
      /unsupported export form[\s\S]*Foo/,
    );
  }
});

test("build startup accepts known allowlisted names and rejects typos", async () => {
  const files = { "a.tsx": "export function Foo() { return <div/>; }" };
  await assert.doesNotReject(validateTree(files, new Set(["Foo"])));
  await assert.rejects(
    validateTree(files, new Set(["Typo"])),
    /Unknown component names[\s\S]*Typo/,
  );
});
