import assert from "node:assert/strict";
import { test } from "node:test";

import { chunkGroups } from "./chunkGroups.js";

// The group a module would be captured by; `initial` stands in for the
// `$initial` tag Rolldown sets on modules the entry imports statically.
function groupFor(id: string, initial = false) {
  const matching = chunkGroups
    .filter(({ tags }) => initial || !tags?.includes("$initial"))
    .filter(({ test }) =>
      typeof test === "function"
        ? test(id)
        : test instanceof RegExp
          ? test.test(id)
          : test === undefined || id.includes(test),
    )
    .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
  const name = matching[0]?.name;
  return typeof name === "string" ? name : undefined;
}

test("initial modules go to the vendor chunks or the entry", () => {
  for (const [id, group] of [
    ["/app/node_modules/react-dom/client.js", "react"],
    ["/app/node_modules/i18next/dist/esm/i18next.js", "i18n"],
    ["/app/node_modules/@tanstack/react-query/build/modern/index.js", "query"],
    ["/app/node_modules/lucide-react/dist/esm/icons/house.js", "vendor"],
    ["/app/node_modules/date-fns/format.js", "vendor"],
    ["/app/node_modules/raviger/dist/main.js", "vendor"],
    ["/app/src/types/user/userApi.ts", "app"],
    ["/app/src/App.tsx", "app"],
  ]) {
    assert.equal(groupFor(id, true), group, id);
  }
});

test("lazy-only vendor packages get their own groups, on both path styles", () => {
  for (const [id, group] of [
    ["/app/node_modules/react/cjs/react.production.js", "react"],
    ["/app/node_modules/react-dom/client.js", "react"],
    ["/app/node_modules/scheduler/index.js", "react"],
    ["/app/node_modules/lucide-react/dist/esm/icons/house.js", "icons"],
    ["/app/node_modules/date-fns/format.js", "date"],
    ["/app/node_modules/dayjs/dayjs.min.js", "date"],
  ]) {
    assert.equal(groupFor(id), group, id);
  }
});

test("lazy-only i18n and query modules fall back to default splitting", () => {
  assert.equal(
    groupFor("/app/node_modules/@tanstack/react-query-devtools/index.js"),
    undefined,
  );
  assert.equal(
    groupFor("C:\\app\\node_modules\\@tanstack\\query-core\\index.js", true),
    "query",
  );
});

test("similarly named packages are not captured", () => {
  for (const id of [
    "/app/node_modules/react-day-picker/dist/esm/index.js",
    "/app/node_modules/react-hook-form/dist/index.esm.mjs",
    "/app/node_modules/dayjs-plugin-foo/index.js",
  ]) {
    assert.ok(!["react", "date"].includes(groupFor(id)!), id);
  }
});

test("copies nested in another package's node_modules stay with that package", () => {
  assert.equal(
    groupFor("/app/node_modules/fhirpath/node_modules/date-fns/index.js"),
    undefined,
  );
});

test("API route definitions are grouped, other type modules are not", () => {
  assert.equal(groupFor("/app/src/types/emr/patient/patientApi.ts"), "api");
  assert.equal(groupFor("/app/src/types/emr/patient/patient.ts"), undefined);
});
