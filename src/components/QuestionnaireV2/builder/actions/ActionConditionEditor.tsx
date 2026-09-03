import { Plus, Trash2, TriangleAlert } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ChoiceChip } from "@/components/QuestionnaireV2/shared/ChoiceChip";
import {
  ActionRule,
  ActionRuleBehavior,
  ActionRuleValue,
  compileCondition,
  compileRef,
  parseCondition,
  questionRef,
  referenceableLinkId,
} from "@/components/QuestionnaireV2/shared/actionExpression";

import {
  AnswerShape,
  QuestionVariable,
  operatorsFor,
  questionOfRef,
} from "@/components/QuestionnaireV2/builder/actionVariables";

import { Question } from "@/types/questionnaire/question";

import {
  ActionVariableSources,
  contextValueLabel,
  numberedQuestionLabel,
  operatorLabel,
  questionLabel,
  unusableReasonLabel,
} from "./labels";

interface ActionConditionEditorProps {
  /** Stable DOM id prefix for this action's controls. */
  idPrefix: string;
  condition: string;
  onChange: (condition: string) => void;
  sources: ActionVariableSources;
  /** A legacy `Q-…` link id was picked: rename it so it can be named from
   *  an expression (the reducer follows the rename through enable_when and
   *  every action). */
  onRenameLinkId: (questionId: string, linkId: string) => void;
  onMarkRequired: (questionId: string) => void;
}

const NUMERIC_TEXT = /^-?\d+(\.\d+)?$/;

/** The value a fresh rule starts with, so every row compiles from the
 *  moment it exists — a half-built row would have no valid expression to
 *  persist. */
function defaultValue(
  shape: AnswerShape | undefined,
  question: Question | undefined,
): ActionRuleValue {
  switch (shape) {
    case "boolean":
      return true;
    case "number":
      return 0;
    case "choice":
    case "choice_multi":
      return question?.answer_option?.[0]?.value ?? "";
    default:
      return "";
  }
}

/** Number entry that commits only what parses (see `NumericAnswerInput`
 *  in VisibilityConditionsCard for why a bare controlled input won't do). */
function NumericRuleValue({
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  value: ActionRuleValue;
  onChange: (next: number) => void;
  "aria-label": string;
}) {
  const [buffer, setBuffer] = useState<string | null>(null);
  return (
    <Input
      type="number"
      aria-label={ariaLabel}
      value={buffer ?? String(value ?? "")}
      onChange={(e) => {
        setBuffer(e.target.value);
        if (e.target.value !== "" && !Number.isNaN(e.target.valueAsNumber)) {
          onChange(e.target.valueAsNumber);
        }
      }}
      onBlur={() => setBuffer(null)}
    />
  );
}

/** Whether a question, or any group above it, is shown conditionally —
 *  then it can be absent from a submission however required it is. */
function isConditional(question: Question, all: Question[]): boolean {
  const path = (list: Question[], trail: Question[]): Question[] | null => {
    for (const candidate of list) {
      const next = [...trail, candidate];
      if (candidate.id === question.id) return next;
      const found = path(candidate.questions ?? [], next);
      if (found) return found;
    }
    return null;
  };
  return (path(all, []) ?? []).some(
    (ancestor) => (ancestor.enable_when?.length ?? 0) > 0,
  );
}

/**
 * The "When" half of an action. Two faces over one stored string: the rule
 * builder (field / operator / value rows joined by AND or OR) for the
 * canonical subset `actionExpression` round-trips, and a plain expression
 * editor for everything else. Mirrors the Logic tab's grammar: no rules
 * means "runs on every submission", the first "Add a condition" makes it
 * conditional, deleting the last rule takes it back.
 */
export function ActionConditionEditor({
  idPrefix,
  condition,
  onChange,
  sources,
  onRenameLinkId,
  onMarkRequired,
}: ActionConditionEditorProps) {
  const { t } = useTranslation();
  const { questions, contextValues } = sources;
  const parsed = parseCondition(condition);
  const [wantsExpression, setWantsExpression] = useState(false);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const expressionMode = wantsExpression || !parsed;

  // Everything in the tree, for the rename's collision check.
  const takenLinkIds = new Set(
    questions.map((entry) => entry.question.link_id),
  );
  const pickable = questions.filter(
    (entry) => !entry.unusable || entry.unusable === "link_id",
  );
  const canAddRule = pickable.length > 0 || contextValues.length > 0;

  const update = (rules: ActionRule[], behavior: ActionRuleBehavior) =>
    onChange(compileCondition(rules, behavior));

  /** The ref a picked question should be stored under — renaming a
   *  legacy link id on the way, since `q_Q-1234` is not a name. */
  const resolveRef = (entry: QuestionVariable): string => {
    if (entry.unusable !== "link_id") return entry.ref;
    const linkId = referenceableLinkId(entry.question.link_id, takenLinkIds);
    onRenameLinkId(entry.question.id, linkId);
    return entry.ref.replace(
      questionRef(entry.question.link_id),
      questionRef(linkId),
    );
  };

  const freshRule = (entry: QuestionVariable | undefined, ref: string) => ({
    ref,
    operator: operatorsFor(entry?.shape)[0],
    value: defaultValue(entry?.shape, entry?.question),
  });

  const addRule = () => {
    if (!parsed) return;
    const first = pickable.find((entry) => !entry.unusable) ?? pickable[0];
    const ref = first ? resolveRef(first) : contextValues[0]?.ref;
    if (!ref) return;
    update([...parsed.rules, freshRule(first, ref)], parsed.behavior);
  };

  const setRule = (index: number, rule: ActionRule) => {
    if (!parsed) return;
    const rules = [...parsed.rules];
    rules[index] = rule;
    update(rules, parsed.behavior);
  };

  const insertAtCaret = (text: string) => {
    const element = textareaRef.current;
    const start = element?.selectionStart ?? condition.length;
    const end = element?.selectionEnd ?? start;
    onChange(condition.slice(0, start) + text + condition.slice(end));
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(start + text.length, start + text.length);
    });
  };

  if (expressionMode) {
    const chips = [
      ...pickable
        .filter((entry) => !entry.unusable)
        .map((entry) => ({
          key: entry.question.id,
          label: questionLabel(entry.question, t),
          insert: compileRef(entry.ref),
        })),
      ...contextValues.map((entry) => ({
        key: entry.ref,
        label: contextValueLabel(entry),
        insert: compileRef(entry.ref),
      })),
    ];
    return (
      <div className="space-y-2">
        <Textarea
          ref={textareaRef}
          id={`${idPrefix}-expression`}
          aria-label={t("action_expression")}
          className="font-mono text-xs"
          rows={3}
          value={condition}
          onChange={(e) => onChange(e.target.value)}
        />
        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip) => (
              <button
                key={chip.key}
                type="button"
                onClick={() => insertAtCaret(chip.insert)}
                className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-700 hover:border-primary-300 hover:text-primary-800"
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500">{t("action_expression_help")}</p>
        {!parsed && !wantsExpression && (
          <p className="text-xs text-gray-500">
            {t("action_custom_expression_note")}
          </p>
        )}
        {confirmReplace ? (
          <div className="space-y-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p>{t("action_replace_expression_confirm")}</p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  setConfirmReplace(false);
                  setWantsExpression(false);
                  update([], "all");
                }}
              >
                {t("action_replace_expression")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setConfirmReplace(false)}
              >
                {t("action_keep_expression")}
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0"
            onClick={() => {
              if (parsed) setWantsExpression(false);
              else setConfirmReplace(true);
            }}
          >
            {t("action_back_to_conditions")}
          </Button>
        )}
      </div>
    );
  }

  const { rules, behavior } = parsed;
  const referenced = rules
    .map((rule) => questionOfRef(rule.ref, questions)?.question)
    .filter((question): question is Question => !!question);
  const allQuestions = questions.map((entry) => entry.question);
  // Answering is what puts `q_<link_id>` into the evaluator's namespace: a
  // referenced question left blank makes the backend raise and the whole
  // submission fail. Optional ones get a warning and a one-click fix;
  // conditionally shown ones cannot be fixed that way — the save rule
  // blocks those, this just says why.
  const conditional = referenced.filter((question) =>
    isConditional(question, allQuestions),
  );
  const optional = referenced.filter(
    (question) => !question.required && !conditional.includes(question),
  );

  return (
    <div className="space-y-3">
      {rules.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
          <p className="text-sm font-medium text-gray-900">
            {t("action_always_runs")}
          </p>
          <p className="text-xs text-gray-500">
            {t("action_always_runs_hint")}
          </p>
        </div>
      )}

      {rules.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-gray-500">
            {t("action_run_when")}
          </p>
          <div className="flex flex-wrap gap-2">
            <ChoiceChip
              control="radio"
              label={t("all_conditions_and")}
              checked={behavior === "all"}
              onCheckedChange={() => update(rules, "all")}
            />
            <ChoiceChip
              control="radio"
              label={t("any_condition_or")}
              checked={behavior === "any"}
              onCheckedChange={() => update(rules, "any")}
            />
          </div>
        </div>
      )}

      <div className="space-y-2">
        {rules.map((rule, index) => {
          const target = questionOfRef(rule.ref, questions);
          const shape = target?.shape;
          const operators = operatorsFor(shape);
          const options = target?.question.answer_option ?? [];
          const rowLabel = t("condition_n", { n: index + 1 });
          const unresolved =
            !target && !contextValues.some((v) => v.ref === rule.ref);
          return (
            <div key={index}>
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
                  <span className="text-sm font-medium text-gray-900">
                    {rowLabel}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() =>
                      update(
                        rules.filter((_, i) => i !== index),
                        behavior,
                      )
                    }
                    aria-label={t("delete")}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="space-y-1 sm:col-span-2">
                    <p className="text-xs text-gray-500">{t("action_field")}</p>
                    <Select
                      value={rule.ref}
                      onValueChange={(picked) => {
                        const entry = questions.find(
                          (candidate) => candidate.ref === picked,
                        );
                        setRule(
                          index,
                          freshRule(entry, entry ? resolveRef(entry) : picked),
                        );
                      }}
                    >
                      <SelectTrigger
                        className="w-full"
                        aria-label={`${rowLabel} ${t("action_field")}`}
                        aria-invalid={unresolved}
                      >
                        <SelectValue placeholder={t("select")} />
                      </SelectTrigger>
                      <SelectContent>
                        {/* A ref that names nothing current (deleted
                            question, registry change) stays visible so the
                            author can see what to fix. */}
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
                            <SelectLabel>
                              {t("action_field_group_answers")}
                            </SelectLabel>
                            {questions.map((entry) => (
                              <SelectItem
                                key={entry.question.id}
                                value={entry.ref}
                                disabled={
                                  !!entry.unusable &&
                                  entry.unusable !== "link_id"
                                }
                              >
                                {numberedQuestionLabel(
                                  entry.question,
                                  sources.numbers,
                                  t,
                                )}
                                {entry.unusable &&
                                  entry.unusable !== "link_id" && (
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
                            <SelectLabel>
                              {t("action_field_group_context")}
                            </SelectLabel>
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
                        if (operator) setRule(index, { ...rule, operator });
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
                    {shape === "boolean" ? (
                      <Select
                        value={rule.value === true ? "true" : "false"}
                        onValueChange={(value) =>
                          setRule(index, { ...rule, value: value === "true" })
                        }
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-label={`${rowLabel} ${t("action_value")}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{t("yes")}</SelectItem>
                          <SelectItem value="false">{t("no")}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : shape === "number" ? (
                      <NumericRuleValue
                        value={rule.value}
                        onChange={(value) => setRule(index, { ...rule, value })}
                        aria-label={`${rowLabel} ${t("action_value")}`}
                      />
                    ) : (shape === "choice" || shape === "choice_multi") &&
                      options.length > 0 ? (
                      <Select
                        value={String(rule.value)}
                        onValueChange={(value) =>
                          setRule(index, { ...rule, value })
                        }
                      >
                        <SelectTrigger
                          className="w-full"
                          aria-label={`${rowLabel} ${t("action_value")}`}
                        >
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
                        aria-label={`${rowLabel} ${t("action_value")}`}
                        value={String(rule.value ?? "")}
                        onChange={(e) => {
                          const text = e.target.value;
                          // Context values carry no type: a numeric entry
                          // compares as a number, anything else as text.
                          const value =
                            !shape && NUMERIC_TEXT.test(text)
                              ? Number(text)
                              : text;
                          setRule(index, { ...rule, value });
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {conditional.length > 0 && (
        <p className="flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-2.5 text-xs text-red-900">
          <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          {t("action_rule_conditional_question", {
            question: conditional.map((q) => questionLabel(q, t)).join(", "),
          })}
        </p>
      )}
      {optional.length > 0 && (
        <div className="space-y-1.5 rounded-md border border-amber-200 bg-amber-50 p-2.5 text-xs text-amber-900">
          <p className="flex items-start gap-2">
            <TriangleAlert aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            {t("action_rule_unanswered_hazard", {
              question: optional.map((q) => questionLabel(q, t)).join(", "),
            })}
          </p>
          <div className="flex flex-wrap gap-2 pl-5">
            {optional.map((question) => (
              <Button
                key={question.id}
                type="button"
                variant="link"
                size="sm"
                className="h-auto px-0 text-amber-900 underline"
                onClick={() => onMarkRequired(question.id)}
              >
                {t("action_mark_required", {
                  question: questionLabel(question, t),
                })}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRule}
          disabled={!canAddRule}
        >
          <Plus className="size-4" />
          {t("add_a_condition")}
        </Button>
        <Button
          type="button"
          variant="link"
          size="sm"
          className="h-auto px-0"
          onClick={() => setWantsExpression(true)}
        >
          {t("action_edit_as_expression")}
        </Button>
      </div>
      {!canAddRule && (
        <p className="text-xs text-gray-500">
          {t("action_no_fields_available")}
        </p>
      )}
    </div>
  );
}
