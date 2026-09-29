import "react-day-picker/style.css";

import { CombinedDatePicker } from "@/components/ui/combined-date-picker";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { QuestionInputGroup } from "./QuestionInputGroup";
import { replaceEntryAt } from "./withEntryAt";

export function DateInput({
  question,
  disabled,
  labelId,
  errorId,
  valueIndex,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);
  const entry = response?.values[valueIndex ?? 0];
  const value = entry?.type === "date" ? entry.value : undefined;

  const handleChange = (date: Date | undefined) => {
    updateResponse({
      values: replaceEntryAt(
        response?.values,
        valueIndex,
        { type: "date", value: date },
        date === undefined,
      ),
    });
  };

  return (
    // The picker trigger takes no aria props, so the group carries the label.
    <QuestionInputGroup
      labelId={labelId}
      required={question.required}
      errorId={errorId}
    >
      <CombinedDatePicker
        value={value}
        onChange={handleChange}
        allowClear
        disabled={disabled}
        buttonClassName="border-gray-300 shadow-none"
      />
    </QuestionInputGroup>
  );
}
