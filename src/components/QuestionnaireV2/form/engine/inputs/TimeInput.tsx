import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { replaceEntryAt } from "./withEntryAt";

export function TimeInput({
  question,
  disabled,
  inputId,
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = (entry?.type === "time" ? entry.value : undefined) ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateResponse({
      values: replaceEntryAt(
        response?.values,
        valueIndex,
        { type: "time", value: e.target.value },
        !e.target.value,
      ),
    });
  };

  return (
    // No text-size override: the base Input's 16px-on-phones scale is
    // deliberate (a smaller font makes iOS zoom the page on focus).
    <Input
      id={inputId}
      type="time"
      aria-required={question.required || undefined}
      value={value}
      className="h-9"
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
