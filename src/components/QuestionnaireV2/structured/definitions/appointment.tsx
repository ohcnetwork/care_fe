import { t } from "i18next";

import { SINGLETON_ROW_ID } from "@/components/QuestionnaireV2/structured/core/rowIds";
import { AppointmentEditor } from "@/components/QuestionnaireV2/structured/types/appointment/AppointmentEditor";
import {
  needsSlot,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/appointment/model";

import type {
  StructuredInputProps,
  StructuredTypeDefinition,
} from "@/components/QuestionnaireV2/structured/types";

function AppointmentInput(props: StructuredInputProps) {
  if (!props.facilityId) return null;
  return <AppointmentEditor {...props} />;
}

export const appointmentDefinition: StructuredTypeDefinition<"appointment"> = {
  type: "appointment",
  component: AppointmentInput,
  requires: ["facilityId"],
  subjects: ["patient", "encounter"],
  // The row is three JSON-safe fields; nothing here is prefetched.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  // The i18n boundary: model.ts's pure needsSlot decision becomes a
  // translated, row-scoped error here — model.ts must not import i18next.
  validate: (projection, edits, questionId, required) =>
    needsSlot(projection, edits, required)
      ? [
          {
            question_id: questionId,
            field_key: "slot_id",
            row_id: SINGLETON_ROW_ID,
            error: t("appointment_slot_required"),
            required: true,
          },
        ]
      : [],
};
