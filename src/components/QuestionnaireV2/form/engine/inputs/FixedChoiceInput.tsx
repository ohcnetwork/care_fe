import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { MultiSelect } from "@/components/ui/multi-select";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { QuestionInputGroup } from "./QuestionInputGroup";

import type { Question } from "@/types/questionnaire/question";

interface FixedChoiceInputProps extends RendererInputProps {
  options: NonNullable<Question["answer_option"]>;
}

/** Past this many options, inline chips give way to a searchable dropdown. */
const INLINE_CHOICE_MAX = 5;

/** Fixed options own the entire answer array, including repeated selections. */
export function FixedChoiceInput({
  question,
  options,
  disabled,
  inputId,
  labelId,
}: FixedChoiceInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);

  const entryForOption = (value: string) => ({
    type: "string" as const,
    value,
    coding: options.find((option) => option.value === value)?.code ?? undefined,
  });
  const dropdown = options.length > INLINE_CHOICE_MAX;
  const dropdownOptions = options.map((option) => ({
    label: option.display ?? option.value,
    value: option.value.toString(),
  }));

  if (dropdown) {
    // Same value shapes as the chip paths below, so enable_when and
    // submission are indifferent to which control rendered.
    // Self-referencing aria-labelledby: the question label first, then the
    // trigger itself, so screen readers announce both the question and the
    // currently selected option (a bare labelId would silence the value).
    const labelling = {
      id: inputId,
      "aria-labelledby": `${labelId} ${inputId}`,
      "aria-required": question.required || undefined,
    };
    if (question.repeats) {
      return (
        <MultiSelect
          value={(response?.values ?? []).map(
            (entry) => entry.value?.toString() ?? "",
          )}
          onValueChange={(selected) =>
            updateResponse({
              values: selected.map(entryForOption),
            })
          }
          options={dropdownOptions}
          placeholder={t("select_an_option")}
          disabled={disabled}
          {...labelling}
        />
      );
    }
    return (
      <Autocomplete
        {...labelling}
        value={response?.values[0]?.value?.toString() ?? ""}
        onChange={(value) =>
          updateResponse({ values: [entryForOption(value)] })
        }
        options={dropdownOptions}
        placeholder={t("select_an_option")}
        disabled={disabled}
      />
    );
  }
  // Repeats → multi-select: one `{ type: "string", value }` entry per
  // selected option, and toggling off removes that entry.
  if (question.repeats) {
    const values = response?.values ?? [];
    const isSelected = (optionValue: string) =>
      values.some((v) => v.value?.toString() === optionValue);

    return (
      <QuestionInputGroup
        labelId={labelId}
        required={question.required}
        className="flex flex-wrap gap-3"
      >
        {options.map((option) => (
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
                  : [...values, entryForOption(option.value)],
              })
            }
          />
        ))}
      </QuestionInputGroup>
    );
  }

  const selectedValue = response?.values[0]?.value;

  return (
    <div
      role="radiogroup"
      aria-labelledby={labelId}
      aria-required={question.required || undefined}
      className="flex flex-wrap gap-3"
    >
      {options.map((option) => (
        <ChoiceChip
          key={option.value}
          control="radio"
          label={option.display ?? option.value}
          checked={selectedValue === option.value}
          disabled={disabled}
          onCheckedChange={() =>
            updateResponse({
              values: [entryForOption(option.value)],
            })
          }
        />
      ))}
    </div>
  );
}
