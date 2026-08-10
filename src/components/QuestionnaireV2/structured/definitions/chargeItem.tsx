import { t } from "i18next";

import { ChargeItemEditor } from "@/components/QuestionnaireV2/structured/types/chargeItem/ChargeItemEditor";
import {
  invalidQuantityRowIds,
  toRequests,
} from "@/components/QuestionnaireV2/structured/types/chargeItem/model";

import type { StructuredTypeDefinition } from "@/components/QuestionnaireV2/structured/types";

export const chargeItemDefinition: StructuredTypeDefinition<"charge_item"> = {
  type: "charge_item",
  component: ChargeItemEditor,
  requires: ["encounterId", "facilityId"],
  subjects: ["encounter"],
  // Charge-item rows contain only plain JSON-serializable data, including
  // display objects needed to repaint restored drafts without refetching.
  draftPolicy: "serialize",
  contract: 2,
  toRequests,
  // i18n boundary: `model.ts`'s `invalidQuantityRowIds` is the pure,
  // row-scoped decision (imports no i18next); this is the only place it
  // becomes a translated, row_id-keyed `QuestionValidationError`.
  validate: (_projection, edits, questionId) =>
    invalidQuantityRowIds(edits).map((rowId) => ({
      question_id: questionId,
      field_key: "quantity",
      row_id: rowId,
      error: t("charge_item_quantity_invalid"),
      required: true,
    })),
};
