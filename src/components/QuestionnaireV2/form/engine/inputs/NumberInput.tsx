import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { coerceNumberValue } from "./numericEntry";
import { replaceEntryAt } from "./withEntryAt";

export function NumberInput({
  question,
  disabled,
  inputId,
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "number" ? entry.value : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = coerceNumberValue(
      e.target.value,
      e.target.valueAsNumber,
      question.type === "integer",
    );
    updateResponse({
      values: replaceEntryAt(
        response?.values,
        valueIndex,
        { type: "number", value: next },
        next === undefined,
      ),
    });
  };

  return (
    <Input
      id={inputId}
      type="number"
      aria-required={question.required || undefined}
      inputMode={question.type === "decimal" ? "decimal" : "numeric"}
      pattern="[0-9]*[.]?[0-9]*"
      value={value?.toString() ?? ""}
      step={question.type === "integer" ? 1 : undefined}
      disabled={disabled}
      onChange={handleChange}
    />
  );
}
