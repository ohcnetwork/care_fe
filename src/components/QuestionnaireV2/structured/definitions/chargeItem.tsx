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
  // D2: every structured type becomes draftable except `files` (D6). A
  // charge-item row is plain, JSON-serializable data (the wire fields plus
  // the definition/performer display objects, themselves plain data) — no
  // `Date`, `File`, or class instance — so it round-trips through a draft
  // exactly. This is also the defect this port fixes: today the display
  // objects live only in `ChargeItemQuestion.tsx`'s component `useState`,
  // which no draft restore or reload can repaint; carrying them on the row
  // itself is what lets a restored draft show title/price again instead of
  // a bare slug.
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
