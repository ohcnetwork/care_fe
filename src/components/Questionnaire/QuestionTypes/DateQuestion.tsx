import { t } from "i18next";
import "react-day-picker/style.css";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { cn } from "@/lib/utils";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";

interface DateQuestionProps {
  questionnaireResponse: QuestionnaireResponse;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  disabled?: boolean;
  clearError: () => void;
  classes?: string;
  disableRightBorder?: boolean;
  index: number;
}

export function DateQuestion({
  questionnaireResponse,
  updateQuestionnaireResponseCB,
  disabled,
  clearError,
  classes,
  disableRightBorder,
  index,
}: DateQuestionProps) {
  const currentValue = questionnaireResponse.values[index]?.value
    ? new Date(questionnaireResponse.values[index].value as string)
    : undefined;

  const handleSelect = (date: Date | undefined) => {
    clearError();
    const newValues = [...questionnaireResponse.values];
    newValues[index] = {
      type: "date",
      value: date,
    };

    updateQuestionnaireResponseCB(
      newValues,
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const showClear = currentValue && !disabled;

  return (
    <div className="flex flex-1">
      <CombinedDatePicker
        value={currentValue}
        onChange={handleSelect}
        disabled={disabled}
        classes={cn("flex-1", classes)}
        buttonClassName={cn(
          "border-gray-300 shadow",
          (showClear || disableRightBorder) && "rounded-r-none border-r-0",
        )}
      />
      {showClear && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleSelect(undefined)}
          aria-label={t("clear")}
          title={t("clear")}
          className={cn(
            "rounded-l-none border-1 border-gray-300",
            disableRightBorder ? "rounded-r-none border-r-0" : "rounded-r-md",
          )}
        >
          <CareIcon icon="l-times" className="size-4" />
        </Button>
      )}
    </div>
  );
}
