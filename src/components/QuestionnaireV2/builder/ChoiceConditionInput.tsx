import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  EnableWhen,
  Question,
  isCodedEnableWhenAnswer,
} from "@/types/questionnaire/question";

interface ChoiceConditionInputProps {
  target: Question;
  answer: EnableWhen["answer"];
  onChange: (answer: EnableWhen["answer"]) => void;
  "aria-label"?: string;
}

/** Offers the answers the form renders: fixed options win over the value
 *  set, as in `ChoiceInput`. Fixed options are matched by value because the
 *  backend does not persist option codes; value-set answers by their code. */
export function ChoiceConditionInput({
  target,
  answer,
  onChange,
  "aria-label": ariaLabel,
}: ChoiceConditionInputProps) {
  const { t } = useTranslation();
  const options = target.answer_option ?? [];
  const valueSet = target.answer_value_set;

  if (!options.length && valueSet) {
    return (
      <ValueSetSelect
        className="w-full"
        aria-label={ariaLabel}
        system={valueSet.slug ?? ""}
        valuesetId={valueSet.external_id}
        value={isCodedEnableWhenAnswer(answer) ? answer : null}
        placeholder={t("select")}
        onSelect={onChange}
      />
    );
  }

  const selected = isCodedEnableWhenAnswer(answer)
    ? undefined
    : options.find((option) => String(option.value) === String(answer));
  return (
    <Select value={selected?.value ?? ""} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue placeholder={t("select")} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.display || option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
