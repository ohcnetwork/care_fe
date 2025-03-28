import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import type { Question } from "@/types/questionnaire/question";

interface QuestionLabelProps {
  question: Question;
  className?: string;
  groupLabel?: boolean;
  isSubQuestion?: boolean;
}

const defaultGroupClass = "text-lg font-medium text-gray-900";
const defaultInputClass = "text-base font-medium block";

export function QuestionLabel({
  question,
  className,
  groupLabel,
  isSubQuestion = false,
}: QuestionLabelProps) {
  const defaultClass = groupLabel ? defaultGroupClass : defaultInputClass;

  return (
    <Label className={className ?? defaultClass}>
      <div className="flex flex-col gap-3 bg-gray-100 md:bg-transparent">
        {(groupLabel || question.type === "structured" || !isSubQuestion) && (
          <div className="hidden md:block h-1 w-4 rounded-full bg-indigo-600" />
        )}
        <div className="flex gap-3 items-center">
          {(groupLabel || question.type === "structured" || !isSubQuestion) && (
            <div className="md:hidden absolute w-1 h-5 rounded-r-sm bg-indigo-500 left-3.5" />
          )}
          <span>
            <span
              className={cn({
                "text-gray-950 font-semibold":
                  question.type === "structured" ||
                  groupLabel ||
                  !isSubQuestion,
              })}
            >
              {question.text}
            </span>
            {question.required && <span className="ml-1 text-red-500">*</span>}
          </span>
          {question.unit?.code && (
            <span className="text-sm text-gray-500">
              ({question.unit.code})
            </span>
          )}
        </div>
      </div>
    </Label>
  );
}
