import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function TimeInput({ question, disabled, inputId }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const first = response?.values[0];
  const value = (first?.type === "time" ? first.value : undefined) ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateResponse({
      values: e.target.value ? [{ type: "time", value: e.target.value }] : [],
    });
  };

  return (
    <Input
      id={inputId}
      type="time"
      value={value}
      // rounded-r-none/border-r-0 merge the field's own border into the note
      // zone's left border — see QuestionField's outer wrapper.
      className="h-9 rounded-r-none border-r-0 text-sm sm:text-base"
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
