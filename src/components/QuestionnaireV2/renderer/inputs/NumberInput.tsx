import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function NumberInput({ question, disabled }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const value = response?.values[0]?.value as number | undefined;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateResponse({
      values:
        e.target.value === ""
          ? []
          : [{ type: "number", value: e.target.valueAsNumber }],
    });
  };

  return (
    <Input
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
