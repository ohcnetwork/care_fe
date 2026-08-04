import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { gridTemplateColumns } from "./structuredListTracks";

describe("gridTemplateColumns", () => {
  it("joins three columns' tracks into one grid-template-columns value, in order", () => {
    assert.equal(
      gridTemplateColumns([
        { width: "280px" },
        { width: "minmax(10rem,1fr)" },
        { width: "auto" },
      ]),
      "280px minmax(10rem,1fr) auto",
    );
  });

  it("a mobileHidden column still takes a desktop track", () => {
    // gridTemplateColumns has no concept of mobileHidden — it only ever
    // sees `{ width }`. A column hidden below `lg` is still visible AT
    // `lg`, so it must still occupy a track; the caller passes every
    // column, filtered on nothing.
    assert.equal(
      gridTemplateColumns([
        { width: "200px" },
        { width: "150px" }, // stands in for a mobileHidden column
      ]),
      "200px 150px",
    );
  });

  it("the actions extra appends a fixed 48px track LAST", () => {
    assert.equal(
      gridTemplateColumns([{ width: "1fr" }, { width: "2fr" }], {
        actions: true,
      }),
      "1fr 2fr 48px",
    );
  });

  it("no columns and no actions => the empty string", () => {
    assert.equal(gridTemplateColumns([]), "");
  });

  it("no columns but actions => the 48px track alone", () => {
    assert.equal(gridTemplateColumns([], { actions: true }), "48px");
  });

  it("the value is a plain single-spaced string, never a newline", () => {
    // This lands in an inline `--structured-cols` custom property
    // (StructuredList.tsx); a stray newline would break the CSS.
    const value = gridTemplateColumns(
      [{ width: "1fr" }, { width: "2fr" }, { width: "3fr" }],
      { actions: true },
    );
    assert.equal(/\n/.test(value), false);
    assert.equal(value.split(" ").length, 4);
    assert.equal(value, "1fr 2fr 3fr 48px");
  });
});
