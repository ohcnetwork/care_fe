import { Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ActionRule,
  ActionRuleBehavior,
} from "@/components/QuestionnaireV2/shared/actionExpression";

import {
  operatorsFor,
  questionOfRef,
} from "@/components/QuestionnaireV2/builder/actionVariables";

import { ActionRuleValueInput } from "./ActionRuleValueInput";
import { contextFieldInput } from "./contextFieldInput";
import {
  ActionVariableSources,
  contextValueLabel,
  numberedQuestionLabel,
  operatorLabel,
  unusableReasonLabel,
} from "./labels";

interface ActionConditionRowProps {
  rule: ActionRule;
  index: number;
  behavior: ActionRuleBehavior;
  sources: ActionVariableSources;
  onSelectField: (ref: string) => void;
  onChange: (rule: ActionRule) => void;
  onRemove: () => void;
}

/** One condition's field, operator and typed value. Its stable parent key
 * keeps buffered input and picker state attached to the same rule. */
export function ActionConditionRow({
  rule,
  index,
  behavior,
  sources,
  onSelectField,
  onChange,
  onRemove,
}: ActionConditionRowProps) {
  const { t } = useTranslation();
  const { questions, contextValues } = sources;
  const target = questionOfRef(rule.ref, questions);
  const fieldInput = contextFieldInput(
    contextValues.find((value) => value.ref === rule.ref),
  );
  const shape = target?.shape ?? fieldInput?.shape;
  const operators = operatorsFor(shape);
  const options =
    target?.question.answer_option ??
    fieldInput?.options?.map(({ value, label, translationKey }) => ({
      value,
      display: translationKey ? t(translationKey) : label,
    })) ??
    [];
  const rowLabel = t("condition_n", { n: index + 1 });
  const unresolved = !target && !contextValues.some((v) => v.ref === rule.ref);
  return (
    <div>
      {index > 0 && (
        <div className="relative flex justify-start py-1 pl-6">
          <span
            className="absolute left-[1.375rem] top-0 h-full w-px bg-gray-200"
            aria-hidden
          />
          <span className="relative rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs font-semibold uppercase text-gray-500">
            {behavior === "all" ? t("and") : t("or")}
          </span>
        </div>
      )}
      <div className="space-y-2 rounded-md bg-gray-50 p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">{rowLabel}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={onRemove}
            aria-label={t("delete")}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1 sm:col-span-2">
            <p className="text-xs text-gray-500">{t("action_field")}</p>
            <Select value={rule.ref} onValueChange={onSelectField}>
              <SelectTrigger
                className="w-full"
                aria-label={`${rowLabel} ${t("action_field")}`}
                aria-invalid={unresolved}
              >
                <SelectValue placeholder={t("select")} />
              </SelectTrigger>
              <SelectContent>
                {/* Keep an unresolved ref visible so the author can see what
                    needs fixing after a question or registry change. */}
                {unresolved && (
                  <SelectItem
                    value={rule.ref}
                    disabled
                    className="text-red-600"
                  >
                    {rule.ref}
                  </SelectItem>
                )}
                {questions.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("action_field_group_answers")}</SelectLabel>
                    {questions.map((entry) => (
                      <SelectItem
                        key={entry.question.id}
                        value={entry.ref}
                        disabled={
                          !!entry.unusable && entry.unusable !== "link_id"
                        }
                      >
                        {numberedQuestionLabel(
                          entry.question,
                          sources.numbers,
                          t,
                        )}
                        {entry.unusable && entry.unusable !== "link_id" && (
                          <span className="ml-1 text-xs text-gray-400">
                            · {unusableReasonLabel(entry.unusable, t)}
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
                {contextValues.length > 0 && (
                  <SelectGroup>
                    <SelectLabel>{t("action_field_group_context")}</SelectLabel>
                    {contextValues.map((entry) => (
                      <SelectItem key={entry.ref} value={entry.ref}>
                        {contextValueLabel(entry)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">{t("operator")}</p>
            <Select
              value={rule.operator}
              onValueChange={(value) => {
                const operator = operators.find((o) => o === value);
                if (operator) onChange({ ...rule, operator });
              }}
            >
              <SelectTrigger
                className="w-full"
                aria-label={`${rowLabel} ${t("operator")}`}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator} value={operator}>
                    {operatorLabel(operator, t)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-gray-500">{t("action_value")}</p>
            <ActionRuleValueInput
              value={rule.value}
              shape={shape}
              date={fieldInput?.date}
              options={options}
              onChange={(value) => onChange({ ...rule, value })}
              aria-label={`${rowLabel} ${t("action_value")}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
