import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

import { StructuredDroppedRowsNotice } from "@/components/QuestionnaireV2/structured/core/StructuredDroppedRowsNotice";
import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

import { createSeed, isEmptyRow, projectValues } from "./model";

/** This type is create-only — a recorded time of death is never prefetched
 *  into the editor. Module scope: a fresh `[]` per render would be a new
 *  baseline identity, defeating the hook's memo. Passed explicitly rather
 *  than omitted so the core receives "the server confirmed zero rows", not
 *  `undefined` (its still-loading/errored signal).
 *
 *  Trade-off: an empty-but-defined baseline makes any `update`/`remove`
 *  edit an orphan; `projectRows` hides such an edit from `single.row`
 *  while `toRequests` (called without a baseline, by contract) would
 *  still compile a PUT from it — but the hook's orphan-prune effect
 *  excises it as soon as `baseline` is defined, i.e. immediately. */
const NO_BASELINE: readonly BaselineRow<TimeOfDeathRow>[] = [];

export function TimeOfDeathEditor({
  question,
  disabled,
}: StructuredInputProps) {
  const { t } = useTranslation();
  // No explicit type arguments. `TRow` infers from `projectValues` /
  // `createSeed` / `isEmptyRow`'s own types below, and `Mode` infers from
  // the `mode: "single"` literal in this same call. Supplying `TRow`
  // explicitly here (`useStructuredRows<TimeOfDeathRow>({...})`) is a trap:
  // TypeScript has no partial type-argument inference, so naming ONE type
  // argument suppresses inference for the rest, and `Mode` silently falls
  // back to its `"list"` default instead of reading `mode: "single"` —
  // narrowing the return to `ListRowsController`, which has no `row`/
  // `setRow` at all. Every future `mode: "single"` call site (appointment,
  // encounter) should call it exactly this way — with no type arguments.
  const single = useStructuredRows({
    questionId: question.id,
    mode: "single",
    baseline: NO_BASELINE,
    projectValues,
    createSeed,
    isEmptyRow,
    disabled,
  });

  return (
    <div className="space-y-4">
      <StructuredDroppedRowsNotice
        droppedEdits={single.droppedEdits}
        rowLabel={() => t("structured_type__time_of_death")}
      />
      <DateTimeInput
        // `aria-label`, not a `<label>`: the renderer owns the visible label
        // whose text equals the question title.
        aria-label={question.text}
        value={single.row?.row.deceased_datetime}
        onDateChange={(value) => {
          // `DateTimeInput` emits `undefined` for both an emptied field and
          // an unparseable one (`toISOWithTimezone`'s two early returns).
          // Routing that to `clearRow()` — which removes the edit outright
          // (an added-then-cleared row annihilates in the log, per
          // `editLog.ts`'s `coalesceOntoRemove`) — rather than a no-op
          // means `setRow` is never called with an empty string in the
          // first place: clearing the field genuinely clears the section,
          // instead of leaving an empty-patch edit for `model.ts`'s
          // `isEmptyRow` filtering to catch after the fact.
          if (value === undefined) {
            single.clearRow();
            return;
          }
          single.setRow({ deceased_datetime: value });
        }}
        max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        disabled={disabled}
      />
    </div>
  );
}
