import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

import { StructuredQuestionType } from "@/components/Questionnaire/data/StructuredFormData";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

import { QuestionGroup } from "./QuestionTypes/QuestionGroup";

// Questions that should be rendered full width
const FULL_WIDTH_QUESTION_TYPES: StructuredQuestionType[] = [
  "medication_request",
  "medication_statement",
];

interface QuestionRendererProps {
  questions: Question[];
  responses: QuestionnaireResponse[];
  onResponseChange: (values: ResponseValue[], questionId: string) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  encounterId?: string;
  facilityId?: string;
  patientId: string;
}

export function QuestionRenderer({
  questions,
  responses,
  onResponseChange,
  errors,
  clearError,
  disabled,
  activeGroupId,
  encounterId,
  facilityId,
  patientId,
}: QuestionRendererProps) {
  const questionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const isPreview = encounterId === "preview";

  useEffect(() => {
    if (activeGroupId && questionRefs.current[activeGroupId]) {
      questionRefs.current[activeGroupId]?.scrollIntoView({ block: "start" });
    }
  }, [activeGroupId]);

  const shouldBeFullWidth = (question: Question): boolean =>
    question.type === "structured" &&
    !!question.structured_type &&
    FULL_WIDTH_QUESTION_TYPES.includes(question.structured_type);

  return (
    <div className="space-y-8 bg-white md:space-y-3">
      {questions.map((question) => (
        <div
          key={question.id}
          ref={(el) => {
            questionRefs.current[question.id] = el;
          }}
          className={cn(
            shouldBeFullWidth(question) ? "md:w-auto" : "max-w-4xl",
          )}
        >
          <div className="m-2">
            <QuestionGroup
              facilityId={facilityId}
              question={question}
              encounterId={encounterId}
              questionnaireResponses={responses}
              updateQuestionnaireResponseCB={onResponseChange}
              errors={errors}
              clearError={clearError}
              disabled={disabled || isPreview}
              activeGroupId={activeGroupId}
              patientId={patientId}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
