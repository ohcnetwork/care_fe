import { t } from "i18next";

import { MedicationRequestEditor } from "@/components/QuestionnaireV2/structured/types/medicationRequest/MedicationRequestEditor";
import {
  invalidDosageFieldErrors,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/medicationRequest/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const medicationRequestDefinition: StructuredTypeDefinition<"medication_request"> =
  {
    type: "medication_request",
    component: MedicationRequestEditor,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    // D2: a medication request row is plain, JSON-serializable data — no
    // `File`/`Date`/class instance — so it round-trips through a draft
    // exactly, matching `diagnosis`/`allergy_intolerance`. The legacy
    // blanket "exclude" was a property of the conflated value array
    // (prefetched server rows mixed with user input, `dirty`-tracked by
    // hand), not of this type's data.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
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
