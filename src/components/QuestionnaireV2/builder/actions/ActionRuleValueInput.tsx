import { useTranslation } from "react-i18next";

import DateField from "@/components/ui/date-field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ActionRuleValue } from "@/components/QuestionnaireV2/shared/actionExpression";

import { AnswerShape } from "@/components/QuestionnaireV2/builder/actionVariables";

import { dateQueryString } from "@/Utils/utils";

import { NumericConditionInput } from "@/components/QuestionnaireV2/builder/NumericConditionInput";
import { AnswerOption } from "@/types/questionnaire/question";

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/;

interface ActionRuleValueInputProps {
  value: ActionRuleValue;
  shape: AnswerShape | undefined;
  date?: boolean;
  options: AnswerOption[];
  "aria-label": string;
  onChange: (value: ActionRuleValue) => void;
}

export function ActionRuleValueInput({
  value,
  shape,
  date,
  options,
  "aria-label": ariaLabel,
  onChange,
}: ActionRuleValueInputProps) {
  const { t } = useTranslation();
  return date ? (
    <div role="group" aria-label={ariaLabel}>
      <DateField
        date={
          typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
            ? new Date(`${value}T00:00:00`)
            : undefined
        }
        onChange={(date) => onChange(dateQueryString(date) ?? "")}
        hideLabels
      />
    </div>
  ) : shape === "boolean" ? (
    <Select
      value={value === true ? "true" : "false"}
      onValueChange={(value) => onChange(value === "true")}
    >
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{t("yes")}</SelectItem>
        <SelectItem value="false">{t("no")}</SelectItem>
      </SelectContent>
    </Select>
  ) : shape === "number" ? (
    <NumericConditionInput
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  ) : (shape === "choice" || shape === "choice_multi") && options.length > 0 ? (
    <Select value={String(value)} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.display || option.value}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  ) : (
    <Input
      aria-label={ariaLabel}
      value={String(value ?? "")}
      onChange={(e) => {
        const text = e.target.value;
        // Context values carry no type: a numeric entry
        // compares as a number, anything else as text.
        const value = !shape && NUMERIC_TEXT.test(text) ? Number(text) : text;
        onChange(value);
      }}
    />
  );
}
