import { Plus, Trash2, TriangleAlert, Zap } from "lucide-react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { CollapsibleSettingsCard } from "@/components/QuestionnaireV2/shared/CollapsibleSettingsCard";
import { ALWAYS_CONDITION } from "@/components/QuestionnaireV2/shared/actionExpression";
import { numberQuestions } from "@/components/QuestionnaireV2/shared/questionTree";

import { ActionIssue } from "@/components/QuestionnaireV2/builder/actionValidation";
import {
  questionVariables,
  reachableContextPaths,
  reachableContextValues,
} from "@/components/QuestionnaireV2/builder/actionVariables";

import { QuestionnaireAction } from "@/types/questionnaire/actions";
import { Question } from "@/types/questionnaire/question";

import { ActionConditionEditor } from "./ActionConditionEditor";
import { InstructionEditor, newInstruction } from "./InstructionEditor";
import { actionPlainWords } from "./actionSummary";
import { ActionVariableSources } from "./labels";
import { ActionRegistry } from "./useActionRegistry";

export interface ActionListEditorProps {
  /** The registry context type the actions evaluate under
   *  (`EncounterQuestionnaire`, `Appointment`, …); null when this record
   *  can never run actions — the list is then read-only-ish: existing
   *  cards can be removed, nothing can be added. */
  contextType: string | null;
  /** The questions whose answers a condition may read — empty for records
   *  that are not questionnaires. */
  questions: Question[];
  actions: QuestionnaireAction[];
  issues: ActionIssue[];
  /** The one expanded card; the host owns it so an issue click can open
   *  the right action. */
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
  registry: ActionRegistry;
  /** The mount's facility, handed to pickers that list facility records. */
  facilityId?: string;
  onActionsChange: (actions: QuestionnaireAction[]) => void;
  /** What the empty state says actions do here — the questionnaire and
   *  the appointment configurations run at different moments. */
  emptyHint: string;
  /** Question-side effects the condition editor may ask for; hosts with
   *  no questions leave them unset. */
  onRenameLinkId?: (questionId: string, linkId: string) => void;
  onMarkRequired?: (questionId: string) => void;
}

/**
 * The list of actions on a record: one collapsible card per action (a
 * "When" rule editor over the "Then" instruction list), summarised in
 * plain words on the card header. Shared by the questionnaire studio
 * (answers + context) and the admin action configurations (context only).
 */
export function ActionListEditor({
  contextType,
  questions,
  actions,
  issues,
  openIndex,
  onOpenIndexChange,
  registry,
  facilityId,
  onActionsChange,
  emptyHint,
  onRenameLinkId,
  onMarkRequired,
}: ActionListEditorProps) {
  const { t } = useTranslation();

  const sources = useMemo<ActionVariableSources>(
    () => ({
      questions: questionVariables(questions),
      contextValues: contextType
        ? reachableContextValues(contextType, registry.fields)
        : [],
      numbers: new Map(
        numberQuestions(questions).flatMap((item) =>
          [item, ...item.children].map(({ question, number }) => [
            question.id,
            number,
          ]),
        ),
      ),
    }),
    [questions, contextType, registry.fields],
  );
  const contextPaths = useMemo(
    () =>
      contextType ? reachableContextPaths(contextType, registry.fields) : [],
    [contextType, registry.fields],
  );
  const issueByIndex = new Map(
    issues.map((issue) => [issue.index, issue.messageKey]),
  );

  const setAction = (index: number, action: QuestionnaireAction) =>
    onActionsChange(actions.map((entry, i) => (i === index ? action : entry)));

  const addAction = () => {
    // One registered instruction is a foregone choice — preselect it so
    // the author only fills in its inputs.
    const only =
      registry.instructions?.length === 1
        ? registry.instructions[0]
        : undefined;
    onActionsChange([
      ...actions,
      {
        condition: ALWAYS_CONDITION,
        instructions: only ? [newInstruction(only, contextPaths)] : [],
      },
    ]);
    onOpenIndexChange(actions.length);
  };

  const removeAction = (index: number) => {
    onActionsChange(actions.filter((_, i) => i !== index));
    if (openIndex === index) onOpenIndexChange(null);
    else if (openIndex !== null && openIndex > index) {
      onOpenIndexChange(openIndex - 1);
    }
  };

  const canAuthor = contextType !== null;

  return (
    <div className="space-y-4">
      {registry.isError && (
        <Alert variant="destructive">
          <AlertDescription>{t("actions_registry_failed")}</AlertDescription>
        </Alert>
      )}

      {registry.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-2/3" />
        </div>
      ) : actions.length === 0 ? (
        canAuthor && (
          <div className="rounded-lg border border-dashed border-gray-300 p-5 text-center">
            <Zap aria-hidden className="mx-auto mb-2 size-5 text-gray-400" />
            <p className="text-sm font-medium text-gray-900">
              {t("actions_empty_title")}
            </p>
            <p className="mb-3 text-xs text-gray-500">{emptyHint}</p>
            <Button type="button" size="sm" onClick={addAction}>
              <Plus className="size-4" />
              {t("add_action")}
            </Button>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {actions.map((action, index) => {
            const issueKey = issueByIndex.get(index);
            const idPrefix = `action-${index}`;
            return (
              <CollapsibleSettingsCard
                key={index}
                title={t("action_n", { n: index + 1 })}
                subtitle={actionPlainWords(
                  action,
                  sources.questions,
                  sources.contextValues,
                  t,
                )}
                open={openIndex === index}
                onOpenChange={(open) => onOpenIndexChange(open ? index : null)}
                badge={
                  <>
                    {issueKey && (
                      <TriangleAlert
                        aria-label={t(issueKey)}
                        className="size-4 text-red-500"
                      />
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={t("delete_action", { n: index + 1 })}
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </>
                }
              >
                <div className="space-y-5">
                  {issueKey && (
                    <p className="flex items-start gap-2 text-xs text-red-600">
                      <TriangleAlert
                        aria-hidden
                        className="mt-0.5 size-3.5 shrink-0"
                      />
                      {t(issueKey)}
                    </p>
                  )}

                  <section className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      {t("action_when")}
                    </h3>
                    <ActionConditionEditor
                      idPrefix={idPrefix}
                      condition={action.condition}
                      onChange={(condition) =>
                        setAction(index, { ...action, condition })
                      }
                      sources={sources}
                      onRenameLinkId={onRenameLinkId ?? (() => {})}
                      onMarkRequired={onMarkRequired ?? (() => {})}
                    />
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-[11px] font-bold uppercase tracking-wide text-gray-400">
                      {t("action_then")}
                    </h3>
                    {action.instructions.map(
                      (instruction, instructionIndex) => (
                        <InstructionEditor
                          key={instructionIndex}
                          idPrefix={`${idPrefix}-instruction-${instructionIndex}`}
                          instruction={instruction}
                          definitions={registry.instructions}
                          contextPaths={contextPaths}
                          sources={sources}
                          facilityId={facilityId}
                          onChange={(next) =>
                            setAction(index, {
                              ...action,
                              instructions: action.instructions.map(
                                (entry, i) =>
                                  i === instructionIndex ? next : entry,
                              ),
                            })
                          }
                          onRemove={() =>
                            setAction(index, {
                              ...action,
                              instructions: action.instructions.filter(
                                (_, i) => i !== instructionIndex,
                              ),
                            })
                          }
                        />
                      ),
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setAction(index, {
                          ...action,
                          instructions: [
                            ...action.instructions,
                            registry.instructions?.length === 1
                              ? newInstruction(
                                  registry.instructions[0],
                                  contextPaths,
                                )
                              : { slug: "", params: {}, context: "self" },
                          ],
                        })
                      }
                    >
                      <Plus className="size-4" />
                      {t("action_add_instruction")}
                    </Button>
                  </section>
                </div>
              </CollapsibleSettingsCard>
            );
          })}

          {canAuthor && (
            <Button type="button" variant="outline" onClick={addAction}>
              <Plus className="size-4" />
              {t("add_action")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
