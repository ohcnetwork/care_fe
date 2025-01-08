import { useEffect, useRef } from "react";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import { QuestionnaireResponse } from "@/types/questionnaire/form";
import { Question } from "@/types/questionnaire/question";

import { QuestionGroup } from "./QuestionTypes/QuestionGroup";

interface QuestionRendererProps {
  questions: Question[];
  responses: QuestionnaireResponse[];
  onResponseChange: (responses: QuestionnaireResponse[]) => void;
  errors: QuestionValidationError[];
  clearError: (questionId: string) => void;
  disabled?: boolean;
  activeGroupId?: string;
  encounterId?: string;
  facilityId: string;
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

  useEffect(() => {
    if (activeGroupId && questionRefs.current[activeGroupId]) {
      questionRefs.current[activeGroupId]?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [activeGroupId]);

  const handleResponseChange = (updatedResponse: QuestionnaireResponse) => {
    const newResponses = [...responses];
    const index = newResponses.findIndex(
      (r) => r.question_id === updatedResponse.question_id,
    );
    if (index !== -1) {
      newResponses[index] = updatedResponse;
    } else {
      newResponses.push(updatedResponse);
    }
    onResponseChange(newResponses);
  };

  return (
    <div className="space-y-4">
      {questions.map((question) => (
        <div
          key={question.id}
          ref={(el) => (questionRefs.current[question.id] = el)}
        >
          <QuestionGroup
            facilityId={facilityId}
            question={question}
            encounterId={encounterId}
            questionnaireResponses={responses}
            updateQuestionnaireResponseCB={handleResponseChange}
            errors={errors}
            clearError={clearError}
            disabled={disabled}
            activeGroupId={activeGroupId}
            patientId={patientId}
          />
        </div>
      ))}
    </div>
  );
}
