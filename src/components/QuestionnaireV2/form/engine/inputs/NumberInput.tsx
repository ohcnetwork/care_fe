import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { withEntryAt } from "./withEntryAt";

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
    const cleared =
      e.target.value === "" || Number.isNaN(e.target.valueAsNumber);
    if (valueIndex === undefined) {
      updateResponse({
        values: cleared
          ? []
          : [{ type: "number", value: e.target.valueAsNumber }],
      });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "number",
        value: cleared ? undefined : e.target.valueAsNumber,
      }),
    });
  };

  return (
    <Input
      id={inputId}
      type="number"
      inputMode={question.type === "decimal" ? "decimal" : "numeric"}
      pattern="[0-9]*[.]?[0-9]*"
      value={value?.toString() ?? ""}
      step={question.type === "integer" ? 1 : undefined}
      disabled={disabled}
      onChange={handleChange}
    />
  );
}
