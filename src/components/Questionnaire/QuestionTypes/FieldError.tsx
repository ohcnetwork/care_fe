import { useTranslation } from "react-i18next";

import { QuestionValidationError } from "@/types/questionnaire/batch";

interface FieldErrorProps {
  fieldKey: string;
  questionId: string;
  errors?: QuestionValidationError[];
  index?: number;
}

export function FieldError({
  fieldKey,
  questionId,
  errors,
  index,
}: FieldErrorProps) {
  const { t } = useTranslation();
  const error = errors?.find(
    (e) =>
      e.question_id === questionId &&
      e.field_key === fieldKey &&
      (index === undefined || e.index === index),
  );

  if (!error) return null;

  const errorMessage = error.error || error.msg;

  return (
    <div className="text-sm text-red-500 mt-1">
      {errorMessage ? t(errorMessage) : t("field_required")}
    </div>
  );
}
