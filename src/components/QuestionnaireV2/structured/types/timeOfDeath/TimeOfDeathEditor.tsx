import { format } from "date-fns";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

import type { BaselineRow } from "@/components/QuestionnaireV2/structured/core/types";
import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

import { createSeed, isEmptyRow, projectValues } from "./model";

/** A patient's recorded time of death is not prefetched into this editor,
 *  and never was (`DeathQuestion.tsx` reads only the response) — this type
 *  is create-only. Module scope, like `projectValues`: a fresh `[]` literal
 *  on every render would be a new baseline identity each time, defeating
 *  the hook's own `useMemo` on it. Passed explicitly (rather than omitted)
 *  so the honest complete set — "the server confirmed zero rows", per the
 *  BASELINE COMPLETENESS CONTRACT — is what the core actually receives,
 *  not `undefined` (its "still loading/errored" signal). */
const NO_BASELINE: readonly BaselineRow<TimeOfDeathRow>[] = [];

export function TimeOfDeathEditor({
  question,
  disabled,
}: StructuredInputProps) {
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
      <DateTimeInput
        // `aria-label`, not a `<label>`: `structuredRendering.spec.ts:85-91`
        // asserts exactly one <label> in the block whose text equals the
        // question title, and that one belongs to the renderer.
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
