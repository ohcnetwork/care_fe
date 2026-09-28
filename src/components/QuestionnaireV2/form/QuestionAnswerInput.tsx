import { useTranslation } from "react-i18next";

import { QuestionInputGroup } from "./engine/inputs/QuestionInputGroup";
import {
  QUESTION_TYPE_COMPONENTS,
  type RendererInputProps,
} from "./engine/questionTypeRegistry";
import { NoteControl } from "./NoteControl";
import { RepeatedQuestionInput } from "./RepeatedQuestionInput";
import { StructuredSlot } from "./StructuredSlot";

interface QuestionAnswerInputProps extends RendererInputProps {
  locked: boolean;
}

/** Choose the answer control without subscribing the question chrome to edits. */
export function QuestionAnswerInput({
  question,
  disabled,
  locked,
  inputId,
  labelId,
  errorId,
}: QuestionAnswerInputProps) {
  const { t } = useTranslation();
  if (question.type === "structured") {
    return (
      <QuestionInputGroup
        labelId={labelId}
        required={question.required}
        errorId={errorId}
      >
        <StructuredSlot question={question} disabled={disabled} />
      </QuestionInputGroup>
    );
  }

  const InputComponent = QUESTION_TYPE_COMPONENTS[question.type];
  // Fixed-option choices manage their selected entries in one multi-select.
  // Keep the same precedence as ChoiceInput when a value set is also present.
  const isSelfManagedChoice =
    question.type === "choice" && !!question.answer_option?.length;
  if (
    InputComponent &&
    question.repeats === true &&
    question.type !== "display" &&
    !isSelfManagedChoice
  ) {
    return (
      <RepeatedQuestionInput
        question={question}
        disabled={disabled}
        locked={locked}
        inputId={inputId}
        labelId={labelId}
        errorId={errorId}
        component={InputComponent}
      />
    );
  }

  // Each control keeps its own border; the note sits behind a slim divider.
  return (
    <div className="flex items-stretch gap-0.5">
      <div className="min-w-0 flex-1">
        {InputComponent ? (
          <InputComponent
            question={question}
            disabled={disabled}
            inputId={inputId}
            labelId={labelId}
            errorId={errorId}
          />
        ) : (
          <p className="p-2 text-sm italic text-gray-400">
            {t("unsupported_question_type")}
          </p>
        )}
      </div>
      {question.type !== "display" && (
        <NoteControl questionId={question.id} locked={locked} />
      )}
    </div>
  );
}
