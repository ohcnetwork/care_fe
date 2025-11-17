import { extractUsedKeys } from "@/scripts/remove-unused-i18n";
import path from "path";
import { describe, expect, it } from "vitest";

describe("extractUsedKeys - full fixture test", () => {
  it("should extract static, plural, Trans, and dynamic keys from fixture", async () => {
    const fixtureDir = path.join(__dirname, "fixtures");

    const { usedKeys, dynamicPrefixes } = await extractUsedKeys(fixtureDir, [
      "tsx",
    ]);

    // -------- Static --------
    expect(usedKeys.has("field_required")).toBe(true);

    // -------- Plural Keys --------
    expect(usedKeys.has("encounter_tag_count")).toBe(true);
    expect(usedKeys.has("entity_count")).toBe(true);

    // multiline plural
    expect(usedKeys.has("entity_count")).toBe(true);
    expect(usedKeys.has("entity_count_one")).toBe(true);
    expect(usedKeys.has("entity_count_other")).toBe(true);

    // -------- Trans component --------
    expect(usedKeys.has("page_title")).toBe(true);

    // -------- Dynamic prefixes --------
    expect(dynamicPrefixes.has("encounter_status__")).toBe(true);

    // Sanity check (not exact count, just non-zero)
    expect(usedKeys.size).toBeGreaterThanOrEqual(7);
  });
});
