import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

import { withEntryAt } from "./withEntryAt";

export function TextInput({
  question,
  disabled,
  inputId,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  // Discriminant check instead of a cast — a mismatched stored value renders
  // empty instead of leaking a wrong-typed value into the input.
  const entry = response?.values[valueIndex ?? 0];
  const value = (entry?.type === "string" ? entry.value : undefined) ?? "";

  const handleChange = (next: string) => {
    if (valueIndex === undefined) {
      updateResponse({ values: next ? [{ type: "string", value: next }] : [] });
      return;
    }
    updateResponse({
      values: withEntryAt(response?.values, valueIndex, {
        type: "string",
        value: next,
      }),
    });
  };

  const props = {
    id: inputId,
    value,
    disabled,
    placeholder: t("enter_details"),
    maxLength: question.max_length,
    // Merges the field's own border into the note zone's left border —
    // see QuestionField's outer wrapper for the other half of this pairing.
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      handleChange(e.target.value),
  };

  return question.type === "text" ? (
    <Textarea rows={3} {...props} />
  ) : (
    <Input type={question.type === "url" ? "url" : "text"} {...props} />
  );
}
