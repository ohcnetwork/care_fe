import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import type { Question } from "@/types/questionnaire/question";

interface QuestionLabelProps {
  question: Question;
  className?: string;
  groupLabel?: boolean;
  isChildQuestion?: boolean;
}

const defaultGroupClass = "text-lg font-medium text-gray-900";
const defaultInputClass = "text-base font-medium block";

export function QuestionLabel({
  question,
  className,
  groupLabel,
  isChildQuestion = false,
}: QuestionLabelProps) {
  const defaultClass = groupLabel ? defaultGroupClass : defaultInputClass;
  return (
    <Label className={className ?? defaultClass}>
      <div className="flex flex-col gap-3 bg-gray-100 sm:bg-transparent">
        <div className="flex gap-3 items-center">
          {/* {groupLabel && (
            <div
              className={cn(
                "h-4 w-1 rounded-full",
                "bg-gray-400"
              )}
            />
          )} */}
          <span>
            {!isChildQuestion && (
              <div
                className={cn(
                  "h-4 w-1 rounded-full inline-block mr-1",
                  question.required ? "bg-blue-600" : "bg-gray-400",
                )}
              />
            )}
            {question.text}
            {question.required && !groupLabel && (
              <span className="ml-1 text-red-500">*</span>
            )}
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
