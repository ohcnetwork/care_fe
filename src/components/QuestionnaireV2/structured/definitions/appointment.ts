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
    appointments.length === 0
      ? validateAppointmentQuestion(undefined, questionId, required)
      : appointments.flatMap((appointment) =>
          validateAppointmentQuestion(appointment, questionId, required),
        ),
  buildRequests: async (
    appointments,
    { patientId, facilityId, questionId, path },
  ) => {
    if (!patientId) return [];
    return appointments
      .filter((appointment) => appointment.slot_id)
      .map(({ note, slot_id, tags }) => ({
        url: `/api/v1/facility/${facilityId}/slots/${slot_id}/create_appointment/`,
        method: "POST" as const,
        body: {
          note,
          patient: patientId,
          tags,
        },
        reference_id: structuredReferenceId("appointment", questionId, path),
      }));
  },
};
