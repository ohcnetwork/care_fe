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
import { DateQuestion } from "./DateQuestion";
import { DateTimeQuestion } from "./DateTimeQuestion";
import { TimeOfDeathQuestion } from "./DeathQuestion";
import { DiagnosisQuestion } from "./DiagnosisQuestion";
import { EncounterQuestion } from "./EncounterQuestion";
import { FilesQuestion } from "./FileQuestion";
import { MedicationRequestQuestion } from "./MedicationRequestQuestion";
import { MedicationStatementQuestion } from "./MedicationStatementQuestion";
import { NotesInput } from "./NotesInput";
import { NumberQuestion } from "./NumberQuestion";
import { QuantityQuestion } from "./QuantityQuestion";
import { SymptomQuestion } from "./SymptomQuestion";
import { TextQuestion } from "./TextQuestion";
import { TimeQuestion } from "./TimeQuestion";

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
  isSubQuestion?: boolean;
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
  isSubQuestion,
}: QuestionInputProps) {
  const { t } = useTranslation();
  const questionnaireResponse = questionnaireResponses.find(
    (v) => v.question_id === question.id,
  );

  if (!questionnaireResponse) {
    return null;
  }

  const handleAddValue = () => {
    const newValues = [...questionnaireResponse.values];
    if (newValues.length === 0) {
      newValues.push({ type: "string", value: "" });
    }
    newValues.push({ type: "string", value: "" });
    updateQuestionnaireResponseCB(
      newValues,
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

      case "date":
        return <DateQuestion {...commonProps} />;

      case "decimal":
      case "integer":
        return <NumberQuestion {...commonProps} />;

      case "quantity":
        return <QuantityQuestion {...commonProps} />;

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
            if (encounterId) {
              return <AllergyQuestion {...commonProps} />;
            }
            return (
              <span>{t("questionnaire_allergy_intolerance_no_encounter")}</span>
            );
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
          case "time_of_death":
            return <TimeOfDeathQuestion {...commonProps} />;
          case "files":
            if (encounterId && facilityId) {
              return (
                <FilesQuestion {...commonProps} encounterId={encounterId} />
              );
            }
            return <span>{t("questionnaire_files_no_encounter")}</span>;
        }
        return null;

      case "display":
        return null;

      case "time":
        return <TimeQuestion {...commonProps} />;

      default:
        return <TextQuestion {...commonProps} />;
    }
  };

  const renderInput = () => {
    const values = !questionnaireResponse.values.length
      ? [{ value: "", type: "string" } as ResponseValue]
      : questionnaireResponse.values;

    if (question.type === "choice" && !question.answer_value_set) {
      return (
        <div className="bg-gray-100 md:bg-transparent px-2 py-1.5">
          <div className="px-2 pt-2 bg-gray-100 md:bg-transparent">
            <QuestionLabel
              question={question}
              isSubQuestion={isSubQuestion}
              className="mb-2 text-md"
            />
            {question.description && (
              <p className="text-sm text-gray-500">{question.description}</p>
            )}
          </div>
          <div className="flex flex-col sm:flex-row">
            <div className="flex-1 min-w-0">{renderSingleInput(0)}</div>
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
        </div>
      );
    }

    return (
      <div className="bg-gray-100 md:bg-transparent px-2 py-1.5">
        {values.map((value, index) => {
          const removeButton = question.repeats &&
            questionnaireResponse.values.length > 1 &&
            (question.type != "choice" || question.answer_value_set) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeValue(index)}
                className="size-10"
                disabled={disabled}
              >
                <CareIcon icon="l-trash" className="size-4" />
              </Button>
            );

          return (
            <div
              key={index}
              className={cn(removeButton && "gap-2 flex items-end")}
            >
              <div
                className={cn("space-y-1", { "flex-1": removeButton })}
                data-question-id={question.id}
              >
                {index === 0 && (
                  <div className="px-2 pt-2 bg-gray-100 md:bg-transparent">
                    <QuestionLabel
                      question={question}
                      isSubQuestion={isSubQuestion}
                    />
                    {question.description && (
                      <p className="text-sm text-gray-500">
                        {question.description}
                      </p>
                    )}
                  </div>
                )}
                <div
                  className={cn("w-full", {
                    "flex flex-col md:flex-row":
                      !question.structured_type && question.type !== "choice",
                    "flex flex-col gap-2": question.type === "choice",
                    "flex-col gap-1":
                      question.repeats || question.type === "text",
                  })}
                >
                  <div className="flex-1 min-w-0">
                    {renderSingleInput(index)}
                  </div>
                  {/* Notes are not available for structured questions */}
                  {!question.structured_type && !question.repeats && (
                    <NotesInput
                      className={cn("w-min", {
                        "bg-white border md:rounded-l-none md:-ml-2 mt-2 md:mt-0":
                          !(
                            question.type === "text" ||
                            question.type === "choice"
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
              <CareIcon icon="l-plus" className="mr-2 size-4" />
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
