import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";

import { QuestionLabel } from "@/components/Questionnaire/QuestionLabel";
import { AppointmentQuestion } from "@/components/Questionnaire/QuestionTypes/AppointmentQuestion";

import { QuestionValidationError } from "@/types/questionnaire/batch";
import type {
  QuestionnaireResponse,
  ResponseValue,
} from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import { AllergyQuestion } from "./AllergyQuestion";
import { BooleanQuestion } from "./BooleanQuestion";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { DateTimeQuestion } from "./DateTimeQuestion";
import { DiagnosisQuestion } from "./DiagnosisQuestion";
import { EncounterQuestion } from "./EncounterQuestion";
import { MedicationRequestQuestion } from "./MedicationRequestQuestion";
import { MedicationStatementQuestion } from "./MedicationStatementQuestion";
import { NotesInput } from "./NotesInput";
import { NumberQuestion } from "./NumberQuestion";
import { SymptomQuestion } from "./SymptomQuestion";
import { TextQuestion } from "./TextQuestion";

interface QuestionInputProps {
  question: Question;
  questionnaireResponses: QuestionnaireResponse[];
  encounterId?: string;
  updateQuestionnaireResponseCB: (
    values: ResponseValue[],
    questionId: string,
    note?: string,
  ) => void;
  errors: QuestionValidationError[];
  clearError: () => void;
  disabled?: boolean;
  facilityId?: string;
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
  const { t } = useTranslation();
  const questionnaireResponse = questionnaireResponses.find(
    (v) => v.question_id === question.id,
  );

  if (!questionnaireResponse) {
    return null;
  }

  const handleAddValue = () => {
    updateQuestionnaireResponseCB(
      [...questionnaireResponse.values, { type: "string", value: "" }],
      questionnaireResponse.question_id,
      questionnaireResponse.note,
    );
  };

  const removeValue = (index: number) => {
    const updatedValues = questionnaireResponse.values.filter(
      (_, i) => i !== index,
    );
    updateQuestionnaireResponseCB(
      updatedValues,
      questionnaireResponse.question_id,
    );
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
      errors,
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
            if (encounterId) {
              return (
                <MedicationRequestQuestion
                  {...commonProps}
                  encounterId={encounterId}
                />
              );
            }
            return (
              <span>{t("questionnaire_medication_request_no_encounter")}</span>
            );
          case "medication_statement":
            if (encounterId) {
              return (
                <MedicationStatementQuestion
                  {...commonProps}
                  encounterId={encounterId}
                />
              );
            }
            return (
              <span>
                {t("questionnaire_medication_statement_no_encounter")}
              </span>
            );
          case "allergy_intolerance":
            return <AllergyQuestion {...commonProps} />;
          case "symptom":
            if (encounterId) {
              return (
                <SymptomQuestion
                  {...commonProps}
                  encounterId={encounterId}
                  patientId={patientId}
                />
              );
            }
            return <span>{t("questionnaire_symptom_no_encounter")}</span>;
          case "diagnosis":
            if (encounterId) {
              return (
                <DiagnosisQuestion {...commonProps} encounterId={encounterId} />
              );
            }
            return <span>{t("questionnaire_diagnosis_no_encounter")}</span>;
          case "appointment":
            if (facilityId) {
              return (
                <AppointmentQuestion {...commonProps} facilityId={facilityId} />
              );
            }
            return <span>{t("questionnaire_appointment_no_encounter")}</span>;
          case "encounter":
            if (encounterId && facilityId) {
              return (
                <EncounterQuestion
                  {...commonProps}
                  facilityId={facilityId}
                  encounterId={encounterId}
                />
              );
            }
            return <span>{t("questionnaire_no_encounter")}</span>;
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
                      handleUpdateNote={(note) => {
                        updateQuestionnaireResponseCB(
                          [...questionnaireResponse.values],
                          questionnaireResponse.question_id,
                          note,
                        );
                      }}
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
              {t("add_another")}
            </Button>
            <NotesInput
              questionnaireResponse={questionnaireResponse}
              handleUpdateNote={(note) => {
                updateQuestionnaireResponseCB(
                  [...questionnaireResponse.values],
                  questionnaireResponse.question_id,
                  note,
                );
              }}
              disabled={disabled}
            />
          </div>
        )}
      </div>
    );
  };

  const error = errors.find((e) => e.question_id === question.id)?.error;

  return (
    <div
      className="space-y-2"
      data-cy={`question-${question.text?.toLowerCase().replace(/\s+/g, "-")}`}
    >
      {renderInput()}
      {error && <p className="text-sm font-medium text-red-500">{error}</p>}
    </div>
  );
}
