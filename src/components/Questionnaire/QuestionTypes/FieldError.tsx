import { useTranslation } from "react-i18next";

import { QuestionValidationError } from "@/types/questionnaire/batch";

interface FieldErrorProps {
  fieldKey: string;
  questionId: string;
  errors?: QuestionValidationError[];
  index?: number;
  id?: string;
}

export function FieldError({
  fieldKey,
  questionId,
  errors,
  index,
  id,
}: FieldErrorProps) {
  const { t } = useTranslation();
  const error = errors?.find(
    (e) =>
      e.question_id === questionId &&
      e.field_key === fieldKey &&
      (index === undefined || e.index === index),
  );

  if (!error) return null;

  return (
    <div id={id} className="text-sm text-red-500 mt-1">
      {error.error || error.msg || t("field_required")}
    </div>
  );
}
