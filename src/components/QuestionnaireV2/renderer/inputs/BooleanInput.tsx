import { useTranslation } from "react-i18next";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function BooleanInput({ question, disabled }: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);
  const value = response?.values[0]?.value as boolean | undefined;

  const handleChange = (next: boolean) => {
    updateResponse({ values: [{ type: "boolean", value: next }] });
  };

  return (
    <div className="flex flex-wrap gap-3">
      <ChoiceChip
        control="radio"
        label={t("yes")}
        checked={value === true}
        disabled={disabled}
        onCheckedChange={() => handleChange(true)}
      />
      <ChoiceChip
        control="radio"
        label={t("no")}
        checked={value === false}
        disabled={disabled}
        onCheckedChange={() => handleChange(false)}
      />
    </div>
  );
}
