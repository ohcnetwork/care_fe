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

    // -------- Plural Keys with t() --------
    expect(usedKeys.has("encounter_tag_count")).toBe(true);
    expect(usedKeys.has("encounter_tag_count_one")).toBe(true);
    expect(usedKeys.has("encounter_tag_count_other")).toBe(true);

    // multiline plural with t()
    expect(usedKeys.has("entity_count")).toBe(true);
    expect(usedKeys.has("entity_count_one")).toBe(true);
    expect(usedKeys.has("entity_count_other")).toBe(true);

    // -------- Plural Keys with t() --------
    expect(usedKeys.has("patient_count")).toBe(true);
    expect(usedKeys.has("patient_count_one")).toBe(true);
    expect(usedKeys.has("patient_count_other")).toBe(true);

    // -------- Trans component without count --------
    expect(usedKeys.has("page_title")).toBe(true);

    // -------- Trans component WITH count in values prop (THE MISSING CASE) --------
    expect(usedKeys.has("found_patient_with_this")).toBe(true);
    expect(usedKeys.has("found_patient_with_this_one")).toBe(true);
    expect(usedKeys.has("found_patient_with_this_other")).toBe(true);

    // -------- Trans component with count - multiline format --------
    expect(usedKeys.has("remove_questions_confirmation")).toBe(true);
    expect(usedKeys.has("remove_questions_confirmation_one")).toBe(true);
    expect(usedKeys.has("remove_questions_confirmation_other")).toBe(true);

    // -------- Dynamic prefixes --------
    expect(dynamicPrefixes.has("encounter_status__")).toBe(true);

    // -------- Edge Cases --------

    // Trans with values but no count - should NOT add plural variants
    expect(usedKeys.has("welcome_message")).toBe(true);
    // These should NOT exist since there's no count
    expect(usedKeys.has("welcome_message_one")).toBe(false);
    expect(usedKeys.has("welcome_message_other")).toBe(false);

    // Trans with i18nKey as JSX expression with static string
    expect(usedKeys.has("static_key")).toBe(true);

    // t() with count = 0 should still add plural variants
    expect(usedKeys.has("no_items")).toBe(true);
    expect(usedKeys.has("no_items_one")).toBe(true);
    expect(usedKeys.has("no_items_other")).toBe(true);

    // t() with multiline and count
    expect(usedKeys.has("multiline_key")).toBe(true);
    expect(usedKeys.has("multiline_key_one")).toBe(true);
    expect(usedKeys.has("multiline_key_other")).toBe(true);

    // Nested template literal should extract prefix
    expect(dynamicPrefixes.has("prefix__")).toBe(true);

    // Sanity check (should have at least the base keys + plurals + edge cases)
    expect(usedKeys.size).toBeGreaterThanOrEqual(20);
  });
});
