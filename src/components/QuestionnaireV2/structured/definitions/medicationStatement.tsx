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
 * Message/field_key pairing mirrors the legacy validator stack exactly
 * (`types/questionnaire/validation.ts`'s `validateFields`, as
 * `MedicationStatementQuestion.tsx`'s `MEDICATION_STATEMENT_FIELDS` used
 * it): a missing dosage is `t("field_required")` (the generic
 * required-field message `validateFields` falls back to for a field with no
 * explicit `validate`), a missing period start is `t("start_date_required")`,
 * and an inverted range is `t("end_date_after_start")`.
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
    // D2: every structured type becomes draftable except `files` (D6). A
    // medication statement row is plain, JSON-serializable data (Code,
    // strings, an optional Period of two strings) — no `Date`, `File`, or
    // class instance — so it round-trips through a draft exactly. Legacy
    // excluded this type wholesale because its `values[0].value` conflated
    // prefetched server rows with user input; contract v2's edit log is the
    // fix.
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
