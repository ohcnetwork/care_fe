import type { FillSubject } from "@/components/QuestionnaireV2/fill/subject";
import {
  isPatientBound,
  subjectResourceId,
} from "@/components/QuestionnaireV2/fill/subject";

import type { SubjectType } from "@/types/questionnaire/questionnaire";
import type {
  QuestionnaireSubmitBody,
  SubmitResult,
} from "@/types/questionnaire/questionnaireApi";

/** Body of `submit_resource/` — resource subjects (location/device/facility)
 *  have neither patient nor encounter; the response hangs off `resource_id`
 *  alone. */
export interface ResourceSubmitBody {
  resource_id: string;
  results: SubmitResult[];
}

/** Where a form's plain answers post, or why they cannot. */
export type PlainSubmitPlan =
  | { kind: "patient_bound"; url: string; body: QuestionnaireSubmitBody }
  | { kind: "resource"; url: string; body: ResourceSubmitBody }
  | { kind: "encounter_required" };

export interface PlainSubmitPlanArgs {
  questionnaireId: string;
  /** The QUESTIONNAIRE's subject type — not the mount's. */
  subjectType: SubjectType;
  subject: FillSubject;
  results: SubmitResult[];
  /** Resuming a server draft — links the submission to it for the backend's
   *  duplicate-submission guard. */
  continueDraftId?: string;
}

/**
 * Decide the endpoint and body for a form's plain (non-structured) answers.
 *
 * Keyed off the QUESTIONNAIRE's `subject_type`, never off the mount. Patient
 * and encounter routes are deliberately one family (`QuestionnaireFillPage`'s
 * subject-type gate lets a patient-subject questionnaire be filled from an
 * encounter route and vice versa), while the backend validates against the
 * questionnaire: it rejects `encounter` on a patient-subject submit and
 * demands one on an encounter-subject submit. A mount-derived body therefore
 * made the cross-family case unsubmittable in every attempt, rolling the
 * atomic batch back with a pydantic message that never named the route.
 *
 * `resource_id` is what the response is recorded against — the patient for a
 * patient-subject questionnaire, the mount's resource (the encounter) for an
 * encounter-subject one.
 *
 * One direction cannot be repaired here: an encounter-subject questionnaire
 * opened on a patient route has no encounter to send at all, so the plan says
 * so and the caller blocks before any network call.
 */
export function planPlainSubmit({
  questionnaireId,
  subjectType,
  subject,
  results,
  continueDraftId,
}: PlainSubmitPlanArgs): PlainSubmitPlan {
  if (!isPatientBound(subject)) {
    return {
      kind: "resource",
      url: `/api/v1/questionnaire/${questionnaireId}/submit_resource/`,
      body: { resource_id: subjectResourceId(subject), results },
    };
  }

  const url = `/api/v1/questionnaire/${questionnaireId}/submit/`;
  const draftLink = continueDraftId ? { form_submission: continueDraftId } : {};

  if (subjectType === "encounter") {
    const encounter =
      subject.type === "encounter" ? subject.encounterId : undefined;
    if (!encounter) return { kind: "encounter_required" };
    return {
      kind: "patient_bound",
      url,
      body: {
        resource_id: subjectResourceId(subject),
        encounter,
        patient: subject.patientId,
        results,
        ...draftLink,
      },
    };
  }

  // Patient-subject: `encounter` must be absent even when the mount has one.
  return {
    kind: "patient_bound",
    url,
    body: {
      resource_id: subject.patientId,
      patient: subject.patientId,
      results,
      ...draftLink,
    },
  };
}
