import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { replaceEntryAt } from "./withEntryAt";

import type { Question } from "@/types/questionnaire/question";

interface ValueSetChoiceInputProps extends RendererInputProps {
  valueSet: NonNullable<Question["answer_value_set"]>;
}

/** A terminology picker edits one positional entry, preserving sibling rows. */
export function ValueSetChoiceInput({
  question,
  valueSet,
  disabled,
  labelId,
  errorId,
  valueIndex,
}: ValueSetChoiceInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Same read/write convention as the other multi-entry inputs
  // (TextInput/NumberInput): absent `valueIndex` keeps the exact
  // single-entry read/replace semantics on `values[0]`; a repeats
  // question supplies an index and writes go through `withEntryAt` so
  // sibling entries keep their positions instead of the whole array
  // being replaced.
  const entry = response?.values[valueIndex ?? 0];
  return (
    <ValueSetSelect
      aria-labelledby={labelId}
      aria-describedby={errorId}
      aria-invalid={!!errorId || undefined}
      system={valueSet.slug ?? ""}
      valuesetId={valueSet.external_id}
      value={entry?.coding ?? null}
      onSelect={(code) => {
        updateResponse({
          values: replaceEntryAt(response?.values, valueIndex, {
            type: "string",
            value: code.display,
            coding: code,
          }),
        });
      }}
      disabled={disabled}
    />
  );
}
