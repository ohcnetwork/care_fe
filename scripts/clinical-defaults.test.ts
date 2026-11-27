import assert from "node:assert/strict";
import { test } from "node:test";

import { envSchema } from "./validate-env";

// The smallest env the schema accepts, so each case fails only on its own value.
const BASE_ENV = {
  REACT_APP_TITLE: "CARE",
  REACT_APP_META_DESCRIPTION: "CARE",
  REACT_PUBLIC_URL: "https://care.example.org",
  REACT_APP_COVER_IMAGE: "https://care.example.org/cover.png",
  REACT_RECAPTCHA_SITE_KEY: "key",
  REACT_CARE_API_URL: "https://careapi.example.org",
};

const parse = (env: Record<string, string>) =>
  envSchema.safeParseAsync({ ...BASE_ENV, ...env });

test("the base env is valid", async () => {
  const result = await parse({});
  assert.ok(result.success, String(result.error));
});

const clinical = (value: unknown) => ({
  REACT_CLINICAL_DEFAULTS: JSON.stringify(value),
});

test("left out keys keep the built-in defaults, and null means none", async () => {
  const result = await parse(
    clinical({ allergy: { category: null }, encounter: { class: "amb" } }),
  );
  assert.ok(result.success);
  const defaults = result.data.REACT_CLINICAL_DEFAULTS!;
  assert.equal(defaults.allergy.category, null);
  assert.equal(defaults.allergy.criticality, "low");
  assert.equal(defaults.symptom.severity, "moderate");
  assert.equal(defaults.encounter.class, "amb");
  assert.equal(defaults.encounter.discharge_disposition, null);
});

test("rejects unknown keys, invalid values and entered_in_error", async () => {
  for (const value of [
    { allergy: { categry: "food" } },
    { symptom: { severity: "bad" } },
    { procedure: { status: "entered_in_error" } },
    { immunization: { status: "draft" } },
  ]) {
    assert.equal(
      (await parse(clinical(value))).success,
      false,
      JSON.stringify(value),
    );
  }
});

test("encounter.class must be an allowed class", async () => {
  const result = await parse({
    REACT_ALLOWED_ENCOUNTER_CLASSES: "imp,amb",
    ...clinical({ encounter: { class: "emer" } }),
  });
  assert.equal(result.success, false);
});

test("the removed encounter settings fail with a pointer to the new one", async () => {
  const result = await parse({ REACT_DEFAULT_ENCOUNTER_TYPE: "imp" });
  assert.equal(result.success, false);
  assert.match(result.error!.message, /REACT_CLINICAL_DEFAULTS/);
});
