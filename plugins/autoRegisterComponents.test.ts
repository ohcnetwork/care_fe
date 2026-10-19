import assert from "node:assert/strict";
import { test } from "node:test";

import {
  assertAllowlistFormsSupported,
  assertKnownComponentNames,
  assertUniqueComponentNames,
  collectUnsupportedComponentTargets,
  transformSource,
} from "./autoRegisterComponents.js";

const ID = "/src/components/X.tsx";

// ponytail: tiny helper avoids repeating the fixed id in every call
const transform = (src: string, include?: ReadonlySet<string> | null) =>
  transformSource(src, ID, include);

// ---------------------------------------------------------------------------
// Happy paths
// ---------------------------------------------------------------------------

test("export function Foo returning JSX is transformed", () => {
  const src = `export function Foo() { return <div/>; }`;
  const result = transform(src);
  assert.ok(result !== null);
  assert.ok(
    result.code.includes(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    ),
  );
  assert.ok(result.code.includes("function Foo"));
  assert.ok(result.code.includes('__careRegisterComponent("Foo", Foo)'));
  assert.ok(result.code.includes("export { FooRegistered as Foo }"));
});

test("export const Bar arrow function returning JSX is transformed", () => {
  const src = `export const Bar = () => <div/>;`;
  const result = transform(src);
  assert.ok(result !== null);
  assert.ok(
    result.code.includes(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    ),
  );
  assert.ok(result.code.includes("const Bar ="));
  assert.ok(result.code.includes('__careRegisterComponent("Bar", Bar)'));
  assert.ok(result.code.includes("export { BarRegistered as Bar }"));
});

test("export default Baz where Baz is a local component is transformed", () => {
  const src = `function Baz() { return <div/>; }\nexport default Baz;`;
  const result = transform(src);
  assert.ok(result !== null);
  assert.ok(
    result.code.includes(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    ),
  );
  assert.ok(result.code.includes('__careRegisterComponent("Baz", Baz)'));
  assert.ok(result.code.includes("export default BazRegistered"));
});

// ---------------------------------------------------------------------------
// Recursive component — original binding must survive (recursion-safe)
// ---------------------------------------------------------------------------

test("recursive component keeps original binding name", () => {
  const src = `export function Tree() { return <Tree/>; }`;
  const result = transform(src);
  assert.ok(result !== null);
  assert.ok(result.code.includes("function Tree"));
  assert.ok(result.code.includes('__careRegisterComponent("Tree", Tree)'));
});

// ---------------------------------------------------------------------------
// Skip paths — transformSource must return null
// ---------------------------------------------------------------------------

test("export { Foo } named-export block returns null", () => {
  const src = `function Foo() { return <div/>; }\nexport { Foo };`;
  assert.equal(transform(src), null);
});

test("aliased export { X as Y } returns null", () => {
  const src = `function X() { return <div/>; }\nexport { X as Y };`;
  assert.equal(transform(src), null);
});

test("multi-declarator export const A = ..., B = ... returns null", () => {
  const src = `export const A = () => <div/>, B = () => <div/>;`;
  assert.equal(transform(src), null);
});

test("forwardRef export returns null", () => {
  const src = `export const Ref = forwardRef((p, ref) => <div ref={ref}/>);`;
  assert.equal(transform(src), null);
});

test("non-component lowercase function returns null", () => {
  // returns JSX so only the PascalCase guard (not the JSX guard) excludes it
  const src = `export function notComp() { return <div/>; }`;
  assert.equal(transform(src), null);
});

// ---------------------------------------------------------------------------
// Allowlist filtering
// ---------------------------------------------------------------------------

test("include=null transforms all matching components", () => {
  const src = `export function Comp() { return <div/>; }`;
  const result = transform(src, null);
  assert.ok(result !== null);
  assert.ok(result.code.includes('__careRegisterComponent("Comp", Comp)'));
});

test("include Set transforms Keep but leaves Drop untouched", () => {
  const src = [
    `export function Keep() { return <div/>; }`,
    `export function Drop() { return <div/>; }`,
  ].join("\n");
  const result = transform(src, new Set(["Keep"]));
  assert.ok(result !== null);
  assert.ok(result.code.includes('__careRegisterComponent("Keep", Keep)'));
  assert.ok(!result.code.includes('__careRegisterComponent("Drop", Drop)'));
  // Drop retains its export keyword
  assert.ok(result.code.includes("export function Drop"));
});

// ---------------------------------------------------------------------------
// collectUnsupportedComponentTargets
// ---------------------------------------------------------------------------

test("collectUnsupportedComponentTargets: export { FooComp } yields FooComp", () => {
  const src = `function FooComp() { return <div/>; }\nexport { FooComp };`;
  const targets = collectUnsupportedComponentTargets(src, ID);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].name, "FooComp");
});

test("collectUnsupportedComponentTargets: aliased export { X as YComp } yields YComp", () => {
  const src = `function X() { return <div/>; }\nexport { X as YComp };`;
  const targets = collectUnsupportedComponentTargets(src, ID);
  assert.equal(targets.length, 1);
  assert.equal(targets[0].name, "YComp");
});

// ---------------------------------------------------------------------------
// assertUniqueComponentNames
// ---------------------------------------------------------------------------

test("assertUniqueComponentNames: duplicate name across files throws", () => {
  const targets = [
    { name: "Foo", file: "/src/a.tsx" },
    { name: "Foo", file: "/src/b.tsx" },
  ];
  assert.throws(() => assertUniqueComponentNames(targets), /Duplicate/);
});

test("assertUniqueComponentNames: unique names do not throw", () => {
  const targets = [
    { name: "Foo", file: "/src/a.tsx" },
    { name: "Bar", file: "/src/b.tsx" },
  ];
  assert.doesNotThrow(() => assertUniqueComponentNames(targets));
});

// ---------------------------------------------------------------------------
// assertAllowlistFormsSupported
// ---------------------------------------------------------------------------

test("assertAllowlistFormsSupported: allowlisted name in unsupported throws", () => {
  const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
  assert.throws(
    () => assertAllowlistFormsSupported(unsupported, new Set(["Foo"])),
    /unsupported export form/,
  );
});

test("assertAllowlistFormsSupported: include=null never throws", () => {
  const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
  assert.doesNotThrow(() => assertAllowlistFormsSupported(unsupported, null));
});

// ---------------------------------------------------------------------------
// assertKnownComponentNames
// ---------------------------------------------------------------------------

test("assertKnownComponentNames: allowlisted typo (unknown name) throws", () => {
  const targets = [{ name: "Foo", file: "/src/a.tsx" }];
  const unsupported: { name: string; file: string }[] = [];
  assert.throws(
    () => assertKnownComponentNames(targets, new Set(["Typo"]), unsupported),
    /Unknown component/,
  );
});

test("assertKnownComponentNames: allowlisted name in unsupported does not throw here", () => {
  const targets: { name: string; file: string }[] = [];
  const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
  assert.doesNotThrow(() =>
    assertKnownComponentNames(targets, new Set(["Foo"]), unsupported),
  );
});

test("assertKnownComponentNames: include=null never throws", () => {
  const targets = [{ name: "Foo", file: "/src/a.tsx" }];
  const unsupported: { name: string; file: string }[] = [];
  assert.doesNotThrow(() =>
    assertKnownComponentNames(targets, null, unsupported),
  );
});
