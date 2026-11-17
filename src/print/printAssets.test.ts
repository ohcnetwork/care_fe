import assert from "node:assert/strict";
import { test } from "node:test";

import { detectImageFormat } from "./printAssets";

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

test("detects formats the compiler can read", () => {
  assert.equal(detectImageFormat(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d)), "png");
  assert.equal(detectImageFormat(bytes(0xff, 0xd8, 0xff, 0xe0)), "jpg");
  assert.equal(detectImageFormat(text("GIF89a")), "gif");
  assert.equal(detectImageFormat(text("RIFF\0\0\0\0WEBPVP8 ")), "webp");
  assert.equal(detectImageFormat(text('<svg xmlns="x"></svg>')), "svg");
  assert.equal(
    detectImageFormat(text('﻿  <?xml version="1.0"?>\n<svg></svg>')),
    "svg",
  );
});

test("rejects anything else", () => {
  assert.equal(detectImageFormat(text("<!doctype html><html>")), null);
  assert.equal(detectImageFormat(text("RIFF\0\0\0\0WAVEfmt ")), null);
  assert.equal(detectImageFormat(bytes()), null);
});
