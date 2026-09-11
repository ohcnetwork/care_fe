import assert from "node:assert/strict";
import { test } from "node:test";

import { parseStoredStructuredValue } from "./storedAnswer";

test("decodes the JSON string composeBatch submits", () => {
  const entries = [{ tooth: "16", marks: ["caries"] }, { tooth: "11" }];
  assert.deepEqual(
    parseStoredStructuredValue(JSON.stringify(entries)),
    entries,
  );
});

test("passes an already-decoded array through untouched", () => {
  const entries = [{ tooth: "16" }];
  assert.equal(parseStoredStructuredValue(entries), entries);
});

test("anything else decodes to no entries instead of throwing", () => {
  assert.deepEqual(parseStoredStructuredValue(undefined), []);
  assert.deepEqual(parseStoredStructuredValue(null), []);
  assert.deepEqual(parseStoredStructuredValue(42), []);
  assert.deepEqual(parseStoredStructuredValue("not json"), []);
  assert.deepEqual(parseStoredStructuredValue('{"tooth":"16"}'), []);
  assert.deepEqual(parseStoredStructuredValue('"16"'), []);
});
