import type { RendererSubject } from "@/components/QuestionnaireV2/form/types";

/**
 * What a fill session is being filled FOR. One member per backend
 * `SubjectType` (`src/types/questionnaire/questionnaire.ts`), each
 * carrying exactly the ids its route can supply — so a mount cannot build
 * a device fill without a device id, and nothing has to defend against
 * "patient id present but meaningless".
 *
 * The patient-bound members (`encounter`, `patient`) are the only ones the
 * clinical legs of the page apply to: structured questions, server drafts,
 * the patient banner and the clinical-history tab. Resource subjects
 * (`location`, `device`, `facility`) submit through the backend's
 * `submit_resource` endpoint, which takes only `{resource_id, results}`.
 */
export type FillSubject =
  | {
      type: "encounter";
      facilityId: string;
      patientId: string;
      encounterId: string;
    }
  | { type: "patient"; patientId: string; facilityId?: string }
  | { type: "location"; facilityId: string; locationId: string }
  | { type: "device"; facilityId: string; deviceId: string }
  | { type: "facility"; facilityId: string };

/** The subjects that carry a patient — the clinical legs' precondition. */
export type PatientBoundSubject = Extract<
  FillSubject,
  { type: "encounter" | "patient" }
>;

export function isPatientBound(
  subject: FillSubject,
): subject is PatientBoundSubject {
  return subject.type === "encounter" || subject.type === "patient";
}

/** The id the backend records the response against (`resource_id`). */
export function subjectResourceId(subject: FillSubject): string {
  switch (subject.type) {
    case "encounter":
      return subject.encounterId;
    case "patient":
      return subject.patientId;
    case "location":
      return subject.locationId;
    case "device":
      return subject.deviceId;
    case "facility":
      return subject.facilityId;
  }
}

/** Draft scope key. The type prefix keeps two subjects that happen to
 *  share an id (nothing guarantees they cannot) in separate drafts. */
export function subjectKeyOf(subject: FillSubject): string {
  return `${subject.type}:${subjectResourceId(subject)}`;
}

/** The renderer's flat view of the subject — what structured inputs read
 *  to decide whether they have the context they require. */
export function rendererSubjectOf(subject: FillSubject): RendererSubject {
  const resourceId = subjectResourceId(subject);
  if (subject.type === "encounter") {
    return {
      patientId: subject.patientId,
      encounterId: subject.encounterId,
      facilityId: subject.facilityId,
      resourceId,
    };
  }
  if (subject.type === "patient") {
    return {
      patientId: subject.patientId,
      facilityId: subject.facilityId,
      resourceId,
    };
  }
  return { facilityId: subject.facilityId, resourceId };
}

/** Where Close/Cancel and a completed submission land. */
export function exitTargetOf(subject: FillSubject): string {
  switch (subject.type) {
    case "encounter":
      return `/facility/${subject.facilityId}/patient/${subject.patientId}/encounter/${subject.encounterId}/updates`;
    case "patient":
      return subject.facilityId
        ? `/facility/${subject.facilityId}/patient/${subject.patientId}/updates`
        : `/patient/${subject.patientId}/updates`;
    case "location":
      return `/facility/${subject.facilityId}/settings/locations/${subject.locationId}`;
    case "device":
      return `/facility/${subject.facilityId}/settings/devices/${subject.deviceId}`;
    case "facility":
      return `/facility/${subject.facilityId}`;
  }
}
