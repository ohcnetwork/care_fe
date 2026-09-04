import { describe, expect, test } from "vitest";

import {
  assertAllowlistFormsSupported,
  assertKnownComponentNames,
  assertUniqueComponentNames,
  collectUnsupportedComponentTargets,
  transformSource,
} from "./autoRegisterComponents.js";

const ID = "/src/components/X.tsx";

const transform = (src: string, include?: ReadonlySet<string> | null) =>
  transformSource(src, ID, include);

describe("autoRegisterComponents", () => {
  // Happy paths

  test("export function Foo returning JSX is transformed", () => {
    const src = `export function Foo() { return <div/>; }`;
    const result = transform(src);
    expect(result).not.toBeNull();
    expect(result!.code).toContain(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    );
    expect(result!.code).toContain("function Foo");
    expect(result!.code).toContain('__careRegisterComponent("Foo", Foo)');
    expect(result!.code).toContain("export { FooRegistered as Foo }");
  });

  test("export const Bar arrow function returning JSX is transformed", () => {
    const src = `export const Bar = () => <div/>;`;
    const result = transform(src);
    expect(result).not.toBeNull();
    expect(result!.code).toContain(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    );
    expect(result!.code).toContain("const Bar =");
    expect(result!.code).toContain('__careRegisterComponent("Bar", Bar)');
    expect(result!.code).toContain("export { BarRegistered as Bar }");
  });

  test("export default Baz where Baz is a local component is transformed", () => {
    const src = `function Baz() { return <div/>; }\nexport default Baz;`;
    const result = transform(src);
    expect(result).not.toBeNull();
    expect(result!.code).toContain(
      'import { register as __careRegisterComponent } from "@/lib/override"',
    );
    expect(result!.code).toContain('__careRegisterComponent("Baz", Baz)');
    expect(result!.code).toContain("export default BazRegistered");
  });

  test("recursive component keeps original binding name", () => {
    const src = `export function Tree() { return <Tree/>; }`;
    const result = transform(src);
    expect(result).not.toBeNull();
    expect(result!.code).toContain("function Tree");
    expect(result!.code).toContain('__careRegisterComponent("Tree", Tree)');
  });

  // Skip paths

  test("export { Foo } named-export block returns null", () => {
    const src = `function Foo() { return <div/>; }\nexport { Foo };`;
    expect(transform(src)).toBeNull();
  });

  test("aliased export { X as Y } returns null", () => {
    const src = `function X() { return <div/>; }\nexport { X as Y };`;
    expect(transform(src)).toBeNull();
  });

  test("multi-declarator export const A = ..., B = ... returns null", () => {
    const src = `export const A = () => <div/>, B = () => <div/>;`;
    expect(transform(src)).toBeNull();
  });

  test("forwardRef export returns null", () => {
    const src = `export const Ref = forwardRef((p, ref) => <div ref={ref}/>);`;
    expect(transform(src)).toBeNull();
  });

  test("non-component lowercase function returns null", () => {
    const src = `export function notComp() { return <div/>; }`;
    expect(transform(src)).toBeNull();
  });

  // Allowlist filtering

  test("include=null transforms all matching components", () => {
    const src = `export function Comp() { return <div/>; }`;
    const result = transform(src, null);
    expect(result).not.toBeNull();
    expect(result!.code).toContain('__careRegisterComponent("Comp", Comp)');
  });

  test("include Set transforms Keep but leaves Drop untouched", () => {
    const src = [
      `export function Keep() { return <div/>; }`,
      `export function Drop() { return <div/>; }`,
    ].join("\n");
    const result = transform(src, new Set(["Keep"]));
    expect(result).not.toBeNull();
    expect(result!.code).toContain('__careRegisterComponent("Keep", Keep)');
    expect(result!.code).not.toContain(
      '__careRegisterComponent("Drop", Drop)',
    );
    expect(result!.code).toContain("export function Drop");
  });

  // collectUnsupportedComponentTargets

  test("export { FooComp } yields FooComp", () => {
    const src = `function FooComp() { return <div/>; }\nexport { FooComp };`;
    const targets = collectUnsupportedComponentTargets(src, ID);
    expect(targets).toHaveLength(1);
    expect(targets[0].name).toBe("FooComp");
  });

  test("aliased export { X as YComp } yields YComp", () => {
    const src = `function X() { return <div/>; }\nexport { X as YComp };`;
    const targets = collectUnsupportedComponentTargets(src, ID);
    expect(targets).toHaveLength(1);
    expect(targets[0].name).toBe("YComp");
  });

  // assertUniqueComponentNames

  test("duplicate name across files throws", () => {
    const targets = [
      { name: "Foo", file: "/src/a.tsx" },
      { name: "Foo", file: "/src/b.tsx" },
    ];
    expect(() => assertUniqueComponentNames(targets)).toThrow(/Duplicate/);
  });

  test("unique names do not throw", () => {
    const targets = [
      { name: "Foo", file: "/src/a.tsx" },
      { name: "Bar", file: "/src/b.tsx" },
    ];
    expect(() => assertUniqueComponentNames(targets)).not.toThrow();
  });

  // assertAllowlistFormsSupported

  test("allowlisted name in unsupported throws", () => {
    const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
    expect(() =>
      assertAllowlistFormsSupported(unsupported, new Set(["Foo"])),
    ).toThrow(/unsupported export form/);
  });

  test("include=null never throws for allowlist forms", () => {
    const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
    expect(() => assertAllowlistFormsSupported(unsupported, null)).not.toThrow();
  });

  // assertKnownComponentNames

  test("allowlisted typo (unknown name) throws", () => {
    const targets = [{ name: "Foo", file: "/src/a.tsx" }];
    const unsupported: { name: string; file: string }[] = [];
    expect(() =>
      assertKnownComponentNames(targets, new Set(["Typo"]), unsupported),
    ).toThrow(/Unknown component/);
  });

  test("allowlisted name in unsupported does not throw", () => {
    const targets: { name: string; file: string }[] = [];
    const unsupported = [{ name: "Foo", file: "/src/a.tsx" }];
    expect(() =>
      assertKnownComponentNames(targets, new Set(["Foo"]), unsupported),
    ).not.toThrow();
  });

  test("include=null never throws for known names", () => {
    const targets = [{ name: "Foo", file: "/src/a.tsx" }];
    const unsupported: { name: string; file: string }[] = [];
    expect(() =>
      assertKnownComponentNames(targets, null, unsupported),
    ).not.toThrow();
  });
});
