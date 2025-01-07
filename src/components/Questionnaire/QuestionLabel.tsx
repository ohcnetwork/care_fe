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
  return (
    <Label className={className ?? defaultClass}>
      <div className="flex flex-col gap-3">
        {groupLabel && <div className="h-1 w-4 rounded-full bg-indigo-600" />}
        <div className="flex gap-3 items-center">
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
