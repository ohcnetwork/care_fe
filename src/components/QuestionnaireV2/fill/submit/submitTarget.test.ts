import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";

import type { SubmitResult } from "@/types/questionnaire/questionnaireApi";

import { planPlainSubmit } from "./submitTarget";

/**
 * `composeBatch.ts` itself is unrunnable under this plain `node --test`
 * harness (it imports `structured/registry.ts`, which pulls in every core
 * definition's component tree — see the header of `composeStructured.test.ts`).
 * The submit-body decision lives in `submitTarget.ts` for exactly that
 * reason; these are composeBatch's plain-answer tests.
 */

const results: SubmitResult[] = [
  { question_id: "q1", values: [{ value: "37" }] },
];

const encounterMount: FillSubject = {
  type: "encounter",
  facilityId: "facility-1",
  patientId: "patient-1",
  encounterId: "encounter-1",
};

const patientMount: FillSubject = {
  type: "patient",
  patientId: "patient-1",
  facilityId: "facility-1",
};

describe("planPlainSubmit — the endpoint/body decision, keyed off the questionnaire", () => {
  it("encounter-subject questionnaire on its own encounter mount: encounter rides along, resource_id is the encounter", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "encounter",
      subject: encounterMount,
      results,
    });

    assert.deepEqual(plan, {
      kind: "patient_bound",
      url: "/api/v1/questionnaire/qn-1/submit/",
      body: {
        resource_id: "encounter-1",
        encounter: "encounter-1",
        patient: "patient-1",
        results,
      },
    });
  });

  it("patient-subject questionnaire filled FROM an encounter route: no encounter, resource_id is the patient — the backend 400s on a stray encounter", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "patient",
      subject: encounterMount,
      results,
    });

    assert.equal(plan.kind, "patient_bound");
    assert.deepEqual(plan.kind === "patient_bound" ? plan.body : undefined, {
      resource_id: "patient-1",
      patient: "patient-1",
      results,
    });
    assert.equal(
      plan.kind === "patient_bound" && "encounter" in plan.body,
      false,
      "the mount's encounter must not leak into a patient-subject submit",
    );
  });

  it("patient-subject questionnaire on a patient mount is unchanged", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "patient",
      subject: patientMount,
      results,
    });

    assert.deepEqual(plan, {
      kind: "patient_bound",
      url: "/api/v1/questionnaire/qn-1/submit/",
      body: { resource_id: "patient-1", patient: "patient-1", results },
    });
  });

  it("encounter-subject questionnaire on a patient route has no encounter to send — the caller must block, not compose a doomed request", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "encounter",
      subject: patientMount,
      results,
    });

    assert.deepEqual(plan, { kind: "encounter_required" });
  });

  it("a resumed server draft links through form_submission", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "encounter",
      subject: encounterMount,
      results,
      continueDraftId: "draft-9",
    });

    assert.equal(
      plan.kind === "patient_bound" ? plan.body.form_submission : undefined,
      "draft-9",
    );
  });

  it("no draft id means no form_submission key at all — an explicit undefined would fail the backend's UUID parse", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "patient",
      subject: patientMount,
      results,
    });

    assert.equal(
      plan.kind === "patient_bound" && "form_submission" in plan.body,
      false,
    );
  });

  it("resource subjects post to submit_resource/ with resource_id alone", () => {
    const plan = planPlainSubmit({
      questionnaireId: "qn-1",
      subjectType: "location",
      subject: {
        type: "location",
        facilityId: "facility-1",
        locationId: "location-1",
      },
      results,
    });

    assert.deepEqual(plan, {
      kind: "resource",
      url: "/api/v1/questionnaire/qn-1/submit_resource/",
      body: { resource_id: "location-1", results },
    });
  });
});
