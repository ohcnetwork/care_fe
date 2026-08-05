import { t } from "i18next";

import { MedicationStatementEditor } from "@/components/QuestionnaireV2/structured/types/medicationStatement/MedicationStatementEditor";
import {
  medicationStatementValidationIssues,
  rowSchema,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/medicationStatement/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

/**
 * i18n boundary: `model.ts`'s `medicationStatementValidationIssues` is the
 * pure, row-scoped decision (imports no i18next); this is the only place
 * its three reasons become translated, row_id-keyed `QuestionValidationError`s.
 * Message/field_key pairings match the validation messages users already see:
 * a missing dosage is `t("field_required")`, a missing period start is
 * `t("start_date_required")`, and an inverted range is
 * `t("end_date_after_start")`.
 */
const REASON_MESSAGE: Record<
  ReturnType<typeof medicationStatementValidationIssues>[number]["reason"],
  () => string
> = {
  missing_dosage: () => t("field_required"),
  missing_period_start: () => t("start_date_required"),
  invalid_period_range: () => t("end_date_after_start"),
};

export const medicationStatementDefinition: StructuredTypeDefinition<"medication_statement"> =
  {
    type: "medication_statement",
    component: MedicationStatementEditor,
    requires: ["patientId", "encounterId"],
    subjects: ["encounter"],
    // Medication statement rows contain only plain JSON-serializable data, so
    // they can be restored from drafts without losing type information.
    draftPolicy: "serialize",
    contract: 2,
    toRequests,
    rowSchema,
    validate: (_projection, edits, questionId) =>
      medicationStatementValidationIssues(edits).map((issue) => ({
        question_id: questionId,
        field_key: issue.fieldKey,
        row_id: issue.rowId,
        error: REASON_MESSAGE[issue.reason](),
        required: true,
      })),
  };
