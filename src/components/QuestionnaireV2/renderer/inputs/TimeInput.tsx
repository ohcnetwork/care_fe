import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

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
    if (valueIndex === undefined) {
      updateResponse({
        values: e.target.value ? [{ type: "time", value: e.target.value }] : [],
      });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "time",
        value: e.target.value,
      }),
    });
  };

  return (
    <Input
      id={inputId}
      type="time"
      value={value}
      className="h-9 text-sm sm:text-base"
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
