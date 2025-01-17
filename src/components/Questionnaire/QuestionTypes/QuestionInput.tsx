import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
import { AllergyQuestion } from "@/components/Questionnaire/QuestionTypes/AllergyQuestion";
import { AppointmentQuestion } from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";
import { BooleanQuestion } from "@/components/Questionnaire/QuestionTypes/BooleanQuestion";
import { ChoiceQuestion } from "@/components/Questionnaire/QuestionTypes/ChoiceQuestion";
import { DateTimeQuestion } from "@/components/Questionnaire/QuestionTypes/DateTimeQuestion";
import { DiagnosisQuestion } from "@/components/Questionnaire/QuestionTypes/DiagnosisQuestion";
import { EncounterQuestion } from "@/components/Questionnaire/QuestionTypes/EncounterQuestion";
import { MedicationRequestQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationRequestQuestion";
import { MedicationStatementQuestion } from "@/components/Questionnaire/QuestionTypes/MedicationStatementQuestion";
import { NotesInput } from "@/components/Questionnaire/QuestionTypes/NotesInput";
import { NumberQuestion } from "@/components/Questionnaire/QuestionTypes/NumberQuestion";
import { SymptomQuestion } from "@/components/Questionnaire/QuestionTypes/SymptomQuestion";
import { TextQuestion } from "@/components/Questionnaire/QuestionTypes/TextQuestion";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

interface QuestionInputProps {
  question: Question;
  questionnaireResponses: QuestionnaireResponse[];
  encounterId?: string;
  updateQuestionnaireResponseCB: (
    questionnaireResponse: QuestionnaireResponse,
  ) => void;
  errors: QuestionValidationError[];
  clearError: () => void;
  disabled?: boolean;
  facilityId: string;
  patientId: string;
}

export function QuestionInput({
  question,
  questionnaireResponses,
  encounterId,
  updateQuestionnaireResponseCB,
  errors,
  clearError,
  disabled,
  facilityId,
  patientId,
}: QuestionInputProps) {
  const questionnaireResponse = questionnaireResponses.find(
    (v) => v.question_id === question.id,
  );

  if (!questionnaireResponse) {
    return null;
  }

  const handleAddValue = () => {
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: [...questionnaireResponse.values, { type: "string", value: "" }],
    });
  };

  const removeValue = (index: number) => {
    const updatedValues = questionnaireResponse.values.filter(
      (_, i) => i !== index,
    );
    updateQuestionnaireResponseCB({
      ...questionnaireResponse,
      values: updatedValues,
    });
  };

  const renderSingleInput = (index: number = 0) => {
    const commonProps = {
      classes: question.styling_metadata?.classes,
      disableRightBorder: true,
      question,
      questionnaireResponse,
      updateQuestionnaireResponseCB,
      disabled,
      withLabel: false,
      clearError,
      index,
      patientId,
    };

    switch (question.type) {
      case "dateTime":
        return <DateTimeQuestion {...commonProps} />;

      case "decimal":
      case "integer":
        return <NumberQuestion {...commonProps} />;

      case "choice":
        return <ChoiceQuestion {...commonProps} />;

      case "text":
      case "string":
        return <TextQuestion {...commonProps} />;

      case "boolean":
        return <BooleanQuestion {...commonProps} />;

      case "structured":
        switch (question.structured_type) {
          case "medication_request":
            return <MedicationRequestQuestion {...commonProps} />;
          case "medication_statement":
            return <MedicationStatementQuestion {...commonProps} />;
          case "allergy_intolerance":
            return <AllergyQuestion {...commonProps} />;
          case "symptom":
            return <SymptomQuestion {...commonProps} />;
          case "diagnosis":
            return <DiagnosisQuestion {...commonProps} />;
          case "appointment":
            return <AppointmentQuestion {...commonProps} />;
          case "encounter":
            if (encounterId) {
              return (
                <EncounterQuestion
                  {...commonProps}
                  encounterId={encounterId}
                  facilityId={facilityId}
                />
              );
            }
            return null;
        }
        return null;

      case "display":
        return null;

      default:
        return <TextQuestion {...commonProps} />;
    }
  };

  const renderInput = () => {
    const values = !questionnaireResponse.values.length
      ? [{ value: "", type: "string" } as ResponseValue]
      : questionnaireResponse.values;

    return (
      <div className="">
        {values.map((value, index) => {
          const removeButton = question.repeats &&
            questionnaireResponse.values.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeValue(index)}
                className="h-10 w-10"
                disabled={disabled}
              >
                <CareIcon icon="l-trash" className="h-4 w-4" />
              </Button>
            );

          return (
            <div
              key={index}
              className={cn("mt-2", removeButton && "gap-2 flex items-end")}
            >
              <div
                className={cn("space-y-1", { "flex-1": removeButton })}
                data-question-id={question.id}
              >
                {index === 0 && <QuestionLabel question={question} />}
                <div
                  className={cn({
                    "flex w-full": !question.structured_type,
                    "flex-col": question.repeats || question.type === "text",
                  })}
                >
                  <div className="flex-1">{renderSingleInput(index)}</div>
                  {/* Notes are not available for structured questions */}
                  {!question.structured_type && !question.repeats && (
                    <NotesInput
                      className={cn({
                        "bg-white border rounded-l-none -ml-2": !(
                          question.type === "text"
                        ),
                        "mt-2": question.type === "text",
                      })}
                      questionnaireResponse={questionnaireResponse}
                      updateQuestionnaireResponseCB={
                        updateQuestionnaireResponseCB
                      }
                      disabled={disabled}
                    />
                  )}
                </div>
              </div>
              {removeButton}
            </div>
          );
        })}
        {question.repeats && (
          <div className="mt-2 flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddValue}
              className=""
              disabled={disabled}
            >
              <CareIcon icon="l-plus" className="mr-2 h-4 w-4" />
              Add Another
            </Button>
            <NotesInput
              questionnaireResponse={questionnaireResponse}
              updateQuestionnaireResponseCB={updateQuestionnaireResponseCB}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    );
  };

  const error = errors.find((e) => e.question_id === question.id)?.error;

  return (
    <div className="space-y-2">
      {renderInput()}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
