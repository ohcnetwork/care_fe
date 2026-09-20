import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeStylingClasses } from "./sanitizeStylingClasses";

test("authored classes cannot bypass overlay restrictions using arbitrary properties", () => {
  for (const token of [
    "[position:fixed]",
    "![position:fixed]",
    "md:![z-index:9999]",
    "hover:[position:absolute]",
    "md:[z-index:9999]",
    "[inset-inline:0]",
    "[--overlay:fixed]",
    "fixed",
    "md:absolute",
    "hover:-top-4",
    "z-[9999]",
  ]) {
    assert.equal(sanitizeStylingClasses(token), undefined, token);
  }
});

test("normal layout classes and arbitrary utility values remain available", () => {
  assert.equal(
    sanitizeStylingClasses(
      "grid grid-cols-[2fr_1fr] md:gap-4 [position:fixed] text-sm rounded-lg",
    ),
    "grid grid-cols-[2fr_1fr] md:gap-4 text-sm rounded-lg",
  );
});
