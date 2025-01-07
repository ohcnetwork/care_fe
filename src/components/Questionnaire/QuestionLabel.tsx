import { Label } from "@/components/ui/label";

import type { Question } from "@/types/questionnaire/question";

interface QuestionLabelProps {
  question: Question;
  className?: string;
}

export function QuestionLabel({
  question,
  className = "text-base font-medium block",
}: QuestionLabelProps) {
  return (
    <Label className={className}>
      <div className="flex justify-between items-center text-gray-800 font-semibold">
        <div>
          {question.text}
          {question.required && <span className="ml-1 text-red-500">*</span>}
        </div>
        {question.unit?.code && (
          <span className="text-sm text-gray-500">{question.unit.code}</span>
        )}
      </div>
    </Label>
  );
}
