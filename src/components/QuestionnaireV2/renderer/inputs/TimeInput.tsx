import { Input } from "@/components/ui/input";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function TimeInput({ question, disabled }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const value = (response?.values[0]?.value as string | undefined) ?? "";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateResponse({
      values: e.target.value ? [{ type: "time", value: e.target.value }] : [],
    });
  };

  return (
    <Input
      type="time"
      value={value}
      className="h-9 text-sm sm:text-base"
      onChange={handleChange}
      disabled={disabled}
    />
  );
}
