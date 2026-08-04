import {
  AppointmentQuestion,
  validateAppointmentQuestion,
} from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";
import { structuredReferenceId } from "@/components/QuestionnaireV2/structured/types";
import { useLegacyResponseCallback } from "./adapt";

function AppointmentInput(props: StructuredInputProps) {
  const updateResponse = useLegacyResponseCallback(props.onChange);
  if (!props.facilityId) return null;
  return (
    <AppointmentQuestion
      question={props.question}
      facilityId={props.facilityId}
      questionnaireResponse={props.response}
      updateQuestionnaireResponseCB={updateResponse}
      disabled={props.disabled}
      errors={props.errors}
    />
  );
}

export const appointmentDefinition: StructuredTypeDefinition<"appointment"> = {
  type: "appointment",
  component: AppointmentInput,
  requires: ["facilityId"],
  subjects: ["patient", "encounter"],
  draftPolicy: "exclude",
  contract: 1,
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
