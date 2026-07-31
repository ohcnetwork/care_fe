import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function ChoiceInput({ question, disabled }: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);

  if (question.answer_option?.length) {
    const selectedValue = response?.values[0]?.value;

    return (
      <div className="flex flex-wrap gap-3">
        {question.answer_option.map((option) => (
          <ChoiceChip
            key={option.value}
            control="radio"
            label={option.display ?? option.value}
            checked={selectedValue === option.value}
            disabled={disabled}
            onCheckedChange={() =>
              updateResponse({
                values: [{ type: "string", value: option.value }],
              })
            }
          />
        ))}
      </div>
    );
  }

  if (question.answer_value_set) {
    return (
      <ValueSetSelect
        system={question.answer_value_set.slug ?? ""}
        valuesetId={question.answer_value_set.external_id}
        value={response?.values[0]?.coding ?? null}
        onSelect={(code) =>
          updateResponse({
            values: [{ type: "string", value: code.display, coding: code }],
          })
        }
        disabled={disabled}
      />
    );
  }

  return null;
}
