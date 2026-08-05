import type { ProjectValues } from "@/components/QuestionnaireV2/structured/core/types";
import type { DataTypeFor } from "@/components/QuestionnaireV2/structured/types";

import type { ResponseValue } from "@/types/questionnaire/form";
import type { StructuredQuestionType } from "@/types/questionnaire/structured";

/**
 * The projection every LIST structured type shares: an empty row set
 * projects to NO values, so the section reads unanswered, and any other row
 * set projects as ONE entry of this type carrying a copy of the rows (never
 * aliasing the caller's array).
 *
 * Rows of such a type are born whole at creation, so there is deliberately
 * no `isEmptyRow` filter here: projection and submission must agree on the
 * row set, and a filter would let an incomplete row vanish from the screen
 * and the request instead of being reported by the type's `validate`. A type
 * whose row CAN be empty (`encounter`, `time_of_death`, `appointment`) owns
 * that emptiness rule itself and does not use this helper.
 */
export function listProjectValues<K extends StructuredQuestionType>(
  type: K,
): ProjectValues<DataTypeFor<K>> {
  return (rows) =>
    rows.length === 0
      ? []
      : // `K` is unresolved here, so TS cannot narrow `ResponseValue` to the
        // one arm this builds; `DataTypeFor<K>` IS that arm's row type by
        // construction (`StructuredDataMap` and `ResponseValue` are
        // key-correlated).
        [{ type, value: [...rows] } as ResponseValue];
}
