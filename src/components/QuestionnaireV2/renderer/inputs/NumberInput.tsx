import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function NumberInput({
  question,
  disabled,
  inputId,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const first = response?.values[0];
  const value = first?.type === "number" ? first.value : undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateResponse({
      values:
        e.target.value === "" || Number.isNaN(e.target.valueAsNumber)
          ? []
          : [{ type: "number", value: e.target.valueAsNumber }],
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
      // Merges the field's own border into the note zone's left border —
      // see QuestionField's outer wrapper for the other half of this pairing.
      className="rounded-r-none border-r-0"
    />
  );
}
