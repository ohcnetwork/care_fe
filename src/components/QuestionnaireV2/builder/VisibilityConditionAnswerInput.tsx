import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  EnableWhen,
  Question,
  isCodedEnableWhenAnswer,
} from "@/types/questionnaire/question";

import { ChoiceConditionInput } from "./ChoiceConditionInput";
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
  return condition.operator === "exists" ? (
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
  ) : targetType === "boolean" ? (
    <Select value={String(condition.answer)} onValueChange={onChange}>
      <SelectTrigger className="w-full" aria-label={ariaLabel}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">{t("yes")}</SelectItem>
        <SelectItem value="No">{t("no")}</SelectItem>
      </SelectContent>
    </Select>
  ) : targetType === "integer" || targetType === "decimal" ? (
    <NumericConditionInput
      value={isCodedEnableWhenAnswer(condition.answer) ? "" : condition.answer}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  ) : target?.type === "choice" &&
    (target.answer_option?.length || target.answer_value_set) ? (
    <ChoiceConditionInput
      target={target}
      answer={condition.answer}
      onChange={onChange}
      aria-label={ariaLabel}
    />
  ) : (
    <Input
      value={String(condition.answer ?? "")}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
