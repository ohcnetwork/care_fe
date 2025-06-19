import { useTranslation } from "react-i18next";

import RadioInput from "@/components/Questionnaire/RadioInput";

import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface BooleanQuestionProps {
  question: Question;
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
  question,
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
}: BooleanQuestionProps) {
  const { t } = useTranslation();

  const selectedValue = questionnaireResponse.values[0]?.value?.toString();
  const options = [
    { value: "true", label: t("yes") },
    { value: "false", label: t("no") },
  ];

  return (
    <RadioInput
      options={options}
      selectedValue={selectedValue ?? ""}
      handleValueChange={(value) => {
        clearError();
        updateQuestionnaireResponseCB(
          [{ type: "boolean", value: value === "true" }],
          questionnaireResponse.question_id,
          questionnaireResponse.note,
        );
      }}
      disabled={disabled}
      question={question}
    />
  );
}
