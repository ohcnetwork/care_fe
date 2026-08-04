import { format } from "date-fns";

import { DateTimeInput } from "@/components/Common/DateTimeInput";

import { useStructuredRows } from "@/components/QuestionnaireV2/structured/core/useStructuredRows";
import type { StructuredInputProps } from "@/components/QuestionnaireV2/structured/types";
import type { TimeOfDeathRow } from "@/types/questionnaire/structuredRows";

import { createSeed, isEmptyRow, projectValues } from "./model";

export function TimeOfDeathEditor({
  question,
  disabled,
}: StructuredInputProps) {
  // Both type arguments explicit — `<TimeOfDeathRow>` alone leaves `Mode`
  // unresolved to its `"list"` default instead of being inferred from the
  // `mode: "single"` property below (a partial explicit type-argument list
  // suppresses inference for the rest in this position), which then makes
  // the return type `ListRowsController` and drops `row`/`setRow` entirely.
  // Every future `mode: "single"` call site inherits this — see task-2
  // report's "awkward seam" note.
  const single = useStructuredRows<TimeOfDeathRow, "single">({
    questionId: question.id,
    mode: "single",
    // No baseline: a patient's recorded time of death is not prefetched
    // into this editor, and never was (`DeathQuestion.tsx` reads only the
    // response). Create-only, so `[]` here is the honest complete set, not
    // a "still loading" stand-in (BASELINE COMPLETENESS CONTRACT).
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
        onDateChange={(value) =>
          value !== undefined && single.setRow({ deceased_datetime: value })
        }
        max={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
        disabled={disabled}
      />
    </div>
  );
}
