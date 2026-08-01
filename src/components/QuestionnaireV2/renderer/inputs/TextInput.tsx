import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function TextInput({ question, disabled, inputId }: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const first = response?.values[0];
  const value = (first?.type === "string" ? first.value : undefined) ?? "";

  const handleChange = (next: string) => {
    updateResponse({ values: next ? [{ type: "string", value: next }] : [] });
  };

  const props = {
    id: inputId,
    value,
    disabled,
    placeholder: t("enter_details"),
    maxLength: question.max_length,
    // Merges the field's own border into the note zone's left border —
    // see QuestionField's outer wrapper for the other half of this pairing.
    className: "rounded-r-none border-r-0",
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(e.target.value),
  };

  return question.type === "text" ? (
    <Textarea rows={3} {...props} />
  ) : (
    <Input type={question.type === "url" ? "url" : "text"} {...props} />
  );
}
