import { useTranslation } from "react-i18next";

import Autocomplete from "@/components/ui/autocomplete";
import { MultiSelect } from "@/components/ui/multi-select";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import { RendererInputProps } from "@/components/QuestionnaireV2/form/engine/questionTypeRegistry";
import { useQuestionResponse } from "@/components/QuestionnaireV2/form/engine/store";

import { withEntryAt } from "./withEntryAt";

/** Ported from the legacy ChoiceQuestion: past this many options the inline
 *  chips give way to a searchable dropdown (`length > 5 ? "dropdown" :
 *  "radio"`) — a 20-option list as chips is unscannable and unanswerable. */
const INLINE_CHOICE_MAX = 5;

export function ChoiceInput({
  question,
  disabled,
  inputId,
  labelId,
  valueIndex,
}: RendererInputProps) {
  const { t } = useTranslation();
  const [response, updateResponse] = useQuestionResponse(question.id);

  if (question.answer_option?.length) {
    const dropdown = question.answer_option.length > INLINE_CHOICE_MAX;
    const dropdownOptions = question.answer_option.map((option) => ({
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
                values: selected.map((value) => ({ type: "string", value })),
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
            updateResponse({ values: [{ type: "string", value }] })
          }
          options={dropdownOptions}
          placeholder={t("select_an_option")}
          disabled={disabled}
        />
      );
    }
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
          aria-required={question.required || undefined}
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
        aria-required={question.required || undefined}
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
    // Same read/write convention as the other multi-entry inputs
    // (TextInput/NumberInput): absent `valueIndex` keeps the exact
    // single-entry read/replace semantics on `values[0]`; a repeats
    // question supplies an index and writes go through `withEntryAt` so
    // sibling entries keep their positions instead of the whole array
    // being replaced.
    const entry = response?.values[valueIndex ?? 0];
    return (
      <ValueSetSelect
        aria-labelledby={labelId}
        system={question.answer_value_set.slug ?? ""}
        valuesetId={question.answer_value_set.external_id}
        value={entry?.coding ?? null}
        onSelect={(code) => {
          const nextEntry = {
            type: "string" as const,
            value: code.display,
            coding: code,
          };
          updateResponse({
            values:
              valueIndex === undefined
                ? [nextEntry]
                : withEntryAt(response?.values, valueIndex, nextEntry),
          });
        }}
        disabled={disabled}
      />
    );
  }

  return null;
}
