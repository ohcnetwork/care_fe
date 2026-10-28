import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import {
  AnswerOption,
  EnableWhen,
  Question,
  isCodedEnableWhenAnswer,
} from "@/types/questionnaire/question";

import { NumericConditionInput } from "./NumericConditionInput";

interface VisibilityConditionAnswerInputProps {
  condition: EnableWhen;
  target: Question | undefined;
  onChange: (answer: EnableWhen["answer"]) => void;
  "aria-label"?: string;
}

export function VisibilityConditionAnswerInput({
  condition,
  target,
  onChange,
  "aria-label": ariaLabel,
}: VisibilityConditionAnswerInputProps) {
  const { t } = useTranslation();
  const targetType = target?.type;

  if (condition.operator === "exists") {
    return (
      <Select
        value={condition.answer === false ? "false" : "true"}
        onValueChange={(value) => onChange(value === "true")}
      >
        <SelectTrigger className="w-full" aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="true">{t("condition_answer_present")}</SelectItem>
          <SelectItem value="false">{t("condition_answer_absent")}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (targetType === "boolean") {
    return (
      <Select value={String(condition.answer)} onValueChange={onChange}>
        <SelectTrigger className="w-full" aria-label={ariaLabel}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Yes">{t("yes")}</SelectItem>
          <SelectItem value="No">{t("no")}</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (targetType === "integer" || targetType === "decimal") {
    return (
      <NumericConditionInput
        value={
          isCodedEnableWhenAnswer(condition.answer) ? "" : condition.answer
        }
        onChange={onChange}
        aria-label={ariaLabel}
      />
    );
  }

  if (targetType === "choice" && target?.answer_value_set) {
    const valueSet = target.answer_value_set;
    const selected = isCodedEnableWhenAnswer(condition.answer)
      ? condition.answer
      : null;
    return (
      <ValueSetSelect
        className="w-full"
        aria-label={ariaLabel}
        system={valueSet.slug ?? ""}
        valuesetId={valueSet.external_id}
        value={selected}
        placeholder={t("select")}
        onSelect={onChange}
      />
    );
  }

  if (targetType === "choice" && target?.answer_option?.length) {
    const options = target.answer_option;
    const selected = findSelectedOption(options, condition.answer);
    return (
      <Select
        value={selected ? String(selected.value) : ""}
        onValueChange={(value) => {
          const option = options.find((o) => String(o.value) === value);
          if (option) onChange(option.code ?? String(option.value));
        }}
      >
        <SelectTrigger className="w-full" aria-label={ariaLabel}>
          <SelectValue placeholder={t("select")} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={String(option.value)} value={String(option.value)}>
              {option.display || String(option.value)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={String(condition.answer ?? "")}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/** Coded options are stored by their code, plain options by their value. */
function findSelectedOption(
  options: AnswerOption[],
  answer: EnableWhen["answer"],
): AnswerOption | undefined {
  if (isCodedEnableWhenAnswer(answer)) {
    return options.find((option) => option.code?.code === answer.code);
  }
  return options.find(
    (option) => !option.code && String(option.value) === String(answer),
  );
}
