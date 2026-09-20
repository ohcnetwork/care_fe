import { validateAppointmentQuestion } from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";

import { AppointmentInput } from "@/components/QuestionnaireV2/structured/inputs/AppointmentInput";

export const appointmentDefinition: StructuredTypeDefinition<"appointment"> = {
  type: "appointment",
  component: AppointmentInput,
  requires: ["facilityId"],
  subjects: ["patient", "encounter"],
  draftPolicy: "serialize",
  validate: (appointments, questionId, required) =>
    validateAppointmentQuestion(appointments[0], questionId, required),
  buildRequests: async (
    appointments,
    { patientId, facilityId, questionId },
  ) => {
    // `subjects` is patient/encounter, so a patient is always in scope
    // here — narrowed rather than asserted (the context type is optional
    // for plugin types that declare a resource subject).
    if (!patientId || appointments.length === 0) return [];
    const { note, slot_id, tags } = appointments[0];
    if (!slot_id) return [];
    return [
      {
        url: `/api/v1/facility/${facilityId}/slots/${slot_id}/create_appointment/`,
        method: "POST",
        body: {
          note,
          patient: patientId,
          tags,
        },
        reference_id: structuredReferenceId("appointment", questionId),
      },
    ];
  },
};
