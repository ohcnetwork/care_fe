import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  return (
    <RadioGroup
      value={selectedValue}
      onValueChange={(value) => {
        clearError();
        updateQuestionnaireResponseCB(
          [
            {
              type: "boolean",
              value: value === "true",
            },
          ],
          questionnaireResponse.question_id,
          questionnaireResponse.note,
        );
      }}
      disabled={disabled}
      className="flex flex-row gap-4"
    >
      {[
        { value: "true", label: t("yes") },
        { value: "false", label: t("no") },
      ].map((option) => (
        <div
          className={cn(
            "border rounded-md p-2 cursor-pointer sm:w-auto hover:border-primary-500 group",
            selectedValue === option.value
              ? "bg-primary-100 border-primary-500"
              : "border-gray-300",
          )}
          key={option.value}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem
              value={option.value}
              id={`${question.id}-${option.value}`}
              className="h-4 w-4 border-2 border-gray-300 text-primary focus:ring-primary group-hover:border-primary-500"
            />
            <Label
              htmlFor={`${question.id}-${option.value}`}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {option.label}
            </Label>
          </div>
        </div>
      ))}
    </RadioGroup>
  );
}
