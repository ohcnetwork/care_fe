import { useTranslation } from "react-i18next";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { EnableWhen, QuestionType } from "@/types/questionnaire/question";

import { NumericConditionInput } from "./NumericConditionInput";

interface VisibilityConditionAnswerInputProps {
  condition: EnableWhen;
  targetType: QuestionType | undefined;
  onChange: (answer: EnableWhen["answer"]) => void;
  "aria-label"?: string;
}

export function VisibilityConditionAnswerInput({
  condition,
  targetType,
  onChange,
  "aria-label": ariaLabel,
}: VisibilityConditionAnswerInputProps) {
  const { t } = useTranslation();
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
      value={condition.answer}
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
