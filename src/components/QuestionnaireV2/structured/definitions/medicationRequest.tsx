import { t } from "i18next";

import { MedicationRequestEditor } from "@/components/QuestionnaireV2/structured/types/medicationRequest/MedicationRequestEditor";
import {
  invalidDosageFieldErrors,
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/medicationRequest/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const medicationRequestDefinition: StructuredTypeDefinition<"medication_request"> =
  {
    type: "medication_request",
    component: MedicationRequestEditor,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    // Medication request rows contain only plain JSON-serializable data, so
    // they can be restored from drafts without losing type information.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    rowSchema,
    // The i18n boundary: `model.ts`'s pure `invalidDosageFieldErrors`
    // becomes translated, row-scoped errors here — model.ts must not import
    // i18next (the `node --test` harness has none). `row_id` (not `index`)
    // is what makes these bind to the correct `StructuredList` cell via
    // `selectStructuredFieldErrors`'s row-identity precedence.
    validate: (_projection, edits, questionId) =>
      invalidDosageFieldErrors(edits).map((error) => ({
        question_id: questionId,
        field_key: error.fieldKey,
        row_id: error.rowId,
        error:
          error.kind === "duration"
            ? t(error.durationError!)
            : t("field_required"),
        required: true,
      })),
  };
