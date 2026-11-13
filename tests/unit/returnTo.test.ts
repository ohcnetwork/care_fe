import assert from "node:assert/strict";
import test from "node:test";

import {
  currentPathWithSafeReturnQuery,
  resolveEncounterReturnTo,
  safeInternalPath,
  withReturnTo,
} from "../../src/Utils/returnTo";

const encounterPath =
  "/facility/facility-1/patient/patient-1/encounter/encounter-1";
const overviewPath = `${encounterPath}/updates`;

test("safeInternalPath rejects non-local destinations", () => {
  assert.equal(safeInternalPath("https://example.com/path"), undefined);
  assert.equal(safeInternalPath("//example.com/path"), undefined);
  assert.equal(safeInternalPath("relative/path"), undefined);
});

test("safeInternalPath keeps allowlisted state but drops sensitive search terms", () => {
  assert.equal(
    safeInternalPath(`${overviewPath}?page=2&search=patient+name&tab=history`),
    `${overviewPath}?page=2&tab=history`,
  );
});

test("resolveEncounterReturnTo accepts only safe destinations in this encounter", () => {
  assert.equal(
    resolveEncounterReturnTo(
      `${overviewPath}?page=2`,
      "facility-1",
      "patient-1",
      "encounter-1",
    ),
    `${overviewPath}?page=2`,
  );
  assert.equal(
    resolveEncounterReturnTo(
      `${encounterPath}/questionnaire/diagnosis`,
      "facility-1",
      "patient-1",
      "encounter-1",
    ),
    overviewPath,
  );
  assert.equal(
    resolveEncounterReturnTo(
      "/facility/facility-1/patient/patient-1/encounter/encounter-2/updates",
      "facility-1",
      "patient-1",
      "encounter-1",
    ),
    overviewPath,
  );
});

test("withReturnTo places a bounded return destination in the form URL", () => {
  const formUrl = withReturnTo(
    "questionnaire/diagnosis",
    `${overviewPath}?page=2&search=patient+name`,
    `https://care.example${overviewPath}?page=2&search=patient+name`,
  );
  const parsed = new URL(formUrl, "https://care.example");

  assert.equal(
    parsed.pathname,
    `${encounterPath}/questionnaire/diagnosis`,
  );
  assert.equal(parsed.searchParams.get("return_to"), `${overviewPath}?page=2`);
  assert.equal(parsed.searchParams.has("search"), false);
});

test("currentPathWithSafeReturnQuery omits unapproved query parameters", () => {
  assert.equal(
    currentPathWithSafeReturnQuery(
      `https://care.example${overviewPath}?page=3&search=patient+name`,
    ),
    `${overviewPath}?page=3`,
  );
});
