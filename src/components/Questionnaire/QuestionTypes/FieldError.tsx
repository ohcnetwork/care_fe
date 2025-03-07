import { FieldErrorProps } from "@/types/questionnaire/validation";

export function FieldError<T extends string>({
  fieldKey,
  questionId,
  errors,
}: FieldErrorProps<T>) {
  const error = errors?.find(
    (error) => error.question_id === questionId && error.field_key === fieldKey,
  )?.error;

  if (!error) return null;

  return <p className="text-sm text-red-500 mt-1">{error}</p>;
}
