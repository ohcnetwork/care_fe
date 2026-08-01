import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { RendererInputProps } from "@/components/QuestionnaireV2/renderer/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/renderer/store";

export function ChoiceInput({
  question,
  disabled,
  labelId,
}: RendererInputProps) {
  const [response, updateResponse] = useQuestionResponse(question.id);

  if (question.answer_option?.length) {
    // Repeats → multi-select: same chips, checkbox semantics. Data shape
    // matches the legacy ChoiceQuestion's MultiSelect exactly — one
    // `{ type: "string", value }` entry per selected option, toggling off
    // removes the entry — so enable_when's all-values evaluation and the
    // eventual submission see the identical array.
    if (question.repeats) {
      const values = response?.values ?? [];
      const isSelected = (optionValue: string) =>
        values.some((v) => v.value?.toString() === optionValue);

      return (
        <div
          role="group"
          aria-labelledby={labelId}
          className="flex flex-wrap gap-3"
        >
          {question.answer_option.map((option) => (
            <ChoiceChip
              key={option.value}
              control="checkbox"
              label={option.display ?? option.value}
              checked={isSelected(option.value)}
              disabled={disabled}
              onCheckedChange={() =>
                updateResponse({
                  values: isSelected(option.value)
                    ? values.filter((v) => v.value?.toString() !== option.value)
                    : [...values, { type: "string", value: option.value }],
                })
              }
            />
          ))}
        </div>
      );
    }

    const selectedValue = response?.values[0]?.value;

    return (
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="flex flex-wrap gap-3"
      >
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
