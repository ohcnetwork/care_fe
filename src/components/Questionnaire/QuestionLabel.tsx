import { cn } from "@/lib/utils";

import { Label } from "@/components/ui/label";

import type { Question } from "@/types/questionnaire/question";

interface QuestionLabelProps {
  question: Question;
  className?: string;
  groupLabel?: boolean;
}

const defaultGroupClass = "text-lg font-medium text-gray-900";
const defaultInputClass = "text-base font-medium block";

export function QuestionLabel({
  question,
  className,
  groupLabel,
}: QuestionLabelProps) {
  const defaultClass = groupLabel ? defaultGroupClass : defaultInputClass;
  const isRequired = question.required;
  return (
    <Label className={className ?? defaultClass}>
      <div className="flex flex-col gap-3">
        <div
          className={cn(
            "absolute h-5 w-1 -ml-6 rounded-full",
            isRequired ? "bg-indigo-600" : "bg-gray-300",
          )}
        />
        <div className="flex gap-3 items-center font-bold">
          <span>
            {question.text}
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
