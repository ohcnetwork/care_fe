import { useTranslation } from "react-i18next";

import RadioInput from "@/components/Questionnaire/RadioInput";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface BooleanQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
}

export function BooleanQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
}: BooleanQuestionProps) {
  const { t } = useTranslation();

  const selectedValue = questionnaireResponse.values[0]?.value?.toString();

  return (
    <RadioInput
      options={[
        { value: "true", label: t("yes") },
        { value: "false", label: t("no") },
      ]}
      value={selectedValue ?? ""}
      onValueChange={(value) => {
        clearError();
        updateQuestionnaireResponseCB(
          [{ type: "boolean", value: value === "true" }],
          questionnaireResponse.question_id,
          questionnaireResponse.note,
        );
      }}
      disabled={disabled}
    />
  );
}
