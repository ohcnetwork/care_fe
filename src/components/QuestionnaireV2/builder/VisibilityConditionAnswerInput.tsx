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
  normalizeBooleanConditionAnswer,
  normalizeExistsConditionAnswer,
} from "@/components/QuestionnaireV2/builder/builderReducer";

import { EnableWhen, QuestionType } from "@/types/questionnaire/question";

import { NumericConditionInput } from "./NumericConditionInput";

interface VisibilityConditionAnswerInputProps {
  condition: EnableWhen;
  targetType: QuestionType | undefined;
  onChange: (answer: EnableWhen["answer"]) => void;
}

export function VisibilityConditionAnswerInput({
  condition,
  targetType,
  onChange,
}: VisibilityConditionAnswerInputProps) {
  const { t } = useTranslation();
  return condition.operator === "exists" ? (
    // `exists` asks whether the target carries a value at
    // all — never which value — and persists that as a
    // literal boolean.
    <Select
      value={
        normalizeExistsConditionAnswer(condition.answer) ? "true" : "false"
      }
      onValueChange={(value) => onChange(value === "true")}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="true">{t("condition_answer_present")}</SelectItem>
        <SelectItem value="false">{t("condition_answer_absent")}</SelectItem>
      </SelectContent>
    </Select>
  ) : targetType === "boolean" ? (
    <Select
      // Tolerates true/false answers on load; any change
      // re-writes them as "Yes"/"No".
      value={normalizeBooleanConditionAnswer(condition.answer)}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="Yes">{t("yes")}</SelectItem>
        <SelectItem value="No">{t("no")}</SelectItem>
      </SelectContent>
    </Select>
  ) : targetType === "integer" || targetType === "decimal" ? (
    <NumericConditionInput value={condition.answer} onChange={onChange} />
  ) : (
    <Input
      value={String(condition.answer ?? "")}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
