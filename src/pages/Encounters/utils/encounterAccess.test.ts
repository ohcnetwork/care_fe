import assert from "node:assert/strict";
import { test } from "node:test";

import { HTTPError } from "@/Utils/request/types";
import { isEncounterAccessDenied } from "./encounterAccess";

const forbiddenError = new HTTPError({
  message: "Request Failed",
  status: 403,
  silent: false,
  cause: { detail: "You do not have permission to perform this action." },
});

const notFoundError = new HTTPError({
  message: "Request Failed",
  status: 404,
  silent: false,
  cause: { detail: "Not found." },
});

test("denies encounter access when primary encounter returns 403 even if patient clinical data is readable", () => {
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: true,
      canReadSelectedEncounter: false,
      primaryEncounterError: forbiddenError,
    }),
    true,
  );
});

test("waits until both primary encounter and patient queries finish loading", () => {
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: true,
      isPatientLoading: false,
      canReadClinicalData: false,
      canReadSelectedEncounter: false,
      primaryEncounterError: null,
    }),
    false,
  );
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: true,
      canReadClinicalData: true,
      canReadSelectedEncounter: false,
      primaryEncounterError: forbiddenError,
    }),
    false,
  );
});

test("allows access when primary encounter loads and user can read clinical data or encounter", () => {
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: true,
      canReadSelectedEncounter: false,
      primaryEncounterError: null,
    }),
    false,
  );
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: false,
      canReadSelectedEncounter: true,
      primaryEncounterError: null,
    }),
    false,
  );
});

test("denies access when primary encounter loads without clinical or encounter read permission", () => {
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: false,
      canReadSelectedEncounter: false,
      primaryEncounterError: null,
    }),
    true,
  );
});

test("does not misclassify non-403 primary encounter errors as permission denied", () => {
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: true,
      canReadSelectedEncounter: false,
      primaryEncounterError: notFoundError,
    }),
    false,
  );
  assert.equal(
    isEncounterAccessDenied({
      isPrimaryEncounterLoading: false,
      isPatientLoading: false,
      canReadClinicalData: false,
      canReadSelectedEncounter: false,
      primaryEncounterError: new Error("Network Error"),
    }),
    false,
  );
});
