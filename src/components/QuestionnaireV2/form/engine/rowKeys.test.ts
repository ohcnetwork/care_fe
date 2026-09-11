import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { EMPTY_ROW_KEYS, dropRowKey, growRowKeys } from "./rowKeys";

describe("growRowKeys", () => {
  it("mints one key per row and keeps the object identity when nothing is missing", () => {
    const three = growRowKeys(EMPTY_ROW_KEYS, 3);
    assert.deepEqual(three.keys, [0, 1, 2]);
    assert.equal(growRowKeys(three, 3), three);
    assert.equal(growRowKeys(three, 2), three);
  });

  it("leaves existing rows on their key when new ones appear", () => {
    const grown = growRowKeys(growRowKeys(EMPTY_ROW_KEYS, 2), 4);
    assert.deepEqual(grown.keys, [0, 1, 2, 3]);
  });
});

describe("dropRowKey", () => {
  it("takes the removed row's key with it so survivors keep theirs", () => {
    // The regression: with index keys, removing the middle row would hand
    // row 2's transient DOM state to row 1's position.
    const three = growRowKeys(EMPTY_ROW_KEYS, 3);
    const after = dropRowKey(three, 3, 1);
    assert.deepEqual(after.keys, [0, 2]);
  });

  it("never reuses a dropped key for a later row", () => {
    const after = dropRowKey(growRowKeys(EMPTY_ROW_KEYS, 3), 3, 1);
    assert.deepEqual(growRowKeys(after, 3).keys, [0, 2, 3]);
  });

  it("materializes keys for rows it has not seen before removing one", () => {
    const after = dropRowKey(EMPTY_ROW_KEYS, 3, 0);
    assert.deepEqual(after.keys, [1, 2]);
  });
});
