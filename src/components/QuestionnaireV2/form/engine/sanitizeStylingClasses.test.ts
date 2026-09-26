import assert from "node:assert/strict";
import { test } from "node:test";

import { sanitizeStylingClasses } from "./sanitizeStylingClasses";

test("authored classes cannot hide, relocate, or load remote content", () => {
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
    "-mt-96",
    "md:-ml-12",
    "-mt-[9999px]",
    "ml-[-9999px]",
    "translate-x-full",
    "md:scale-150",
    "rotate-45",
    "hidden",
    "invisible",
    "opacity-0",
    "h-0",
    "overflow-hidden",
    "bg-[url(https://attacker.example/p.png)]",
    "[&_*]:hidden",
    "grid-cols-[9999px_1fr]",
  ]) {
    assert.equal(sanitizeStylingClasses(token), undefined, token);
  }
});

test("builder layouts and responsive decoration remain available", () => {
  assert.equal(
    sanitizeStylingClasses(
      "grid grid-cols-[2fr_1fr] md:gap-4 [position:fixed] text-sm rounded-lg",
    ),
    "grid grid-cols-[2fr_1fr] md:gap-4 text-sm rounded-lg",
  );
  for (const classes of [
    "grid grid-cols-1",
    "grid grid-cols-2",
    "grid grid-cols-[1fr_2fr]",
    "sm:grid-cols-2 lg:grid-cols-3 col-span-full",
    "flex flex-col items-center justify-between p-4 space-y-3",
    "mx-auto border border-gray-200 rounded-xl font-medium text-base",
  ]) {
    assert.equal(sanitizeStylingClasses(classes), classes);
  }
});
