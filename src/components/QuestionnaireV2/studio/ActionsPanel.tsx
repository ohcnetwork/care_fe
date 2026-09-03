import { Plus, Trash2, TriangleAlert, Zap } from "lucide-react";
import { Dispatch, useMemo } from "react";
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
import { ActionConditionEditor } from "@/components/QuestionnaireV2/builder/actions/ActionConditionEditor";
import {
  InstructionEditor,
  newInstruction,
} from "@/components/QuestionnaireV2/builder/actions/InstructionEditor";
import { ActionVariableSources } from "@/components/QuestionnaireV2/builder/actions/labels";
import { BuilderAction } from "@/components/QuestionnaireV2/builder/builderReducer";

import {
  QuestionnaireAction,
  actionContextTypeFor,
} from "@/types/questionnaire/actions";
import { Question } from "@/types/questionnaire/question";
import { SubjectType } from "@/types/questionnaire/questionnaire";

import { actionPlainWords } from "./actionSummary";
import { ActionRegistry } from "./useActionRegistry";

export interface ActionsPanelProps {
  subjectType: SubjectType;
  questions: Question[];
  actions: QuestionnaireAction[];
  issues: ActionIssue[];
  /** The one expanded card; the page owns it so an issue click can open
   *  the right action. */
  openIndex: number | null;
  onOpenIndexChange: (index: number | null) => void;
  registry: ActionRegistry;
  /** The mount's facility, handed to pickers that list facility records. */
  facilityId?: string;
  dispatch: Dispatch<BuilderAction>;
}

/**
 * The inspector's questionnaire-level automations: one collapsible card per
 * action (a "When" rule editor over the "Then" instruction list), summarised
 * in plain words on the card header. Edits flow through `setActions`; the
 * page's Save Changes PUTs them with the question tree.
 */
export function ActionsPanel({
  subjectType,
  questions,
  actions,
  issues,
  openIndex,
  onOpenIndexChange,
  registry,
  facilityId,
  dispatch,
}: ActionsPanelProps) {
  const { t } = useTranslation();
  const contextType = actionContextTypeFor(subjectType);

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

  const setActions = (next: QuestionnaireAction[]) =>
    dispatch({ type: "setActions", actions: next });
  const setAction = (index: number, action: QuestionnaireAction) =>
    setActions(actions.map((entry, i) => (i === index ? action : entry)));

  const addAction = () => {
    // One registered instruction is a foregone choice — preselect it so
    // the author only fills in its inputs.
    const only =
      registry.instructions?.length === 1
        ? registry.instructions[0]
        : undefined;
    setActions([
      ...actions,
      {
        condition: ALWAYS_CONDITION,
        instructions: only ? [newInstruction(only, contextPaths)] : [],
      },
    ]);
    onOpenIndexChange(actions.length);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
    if (openIndex === index) onOpenIndexChange(null);
    else if (openIndex !== null && openIndex > index) {
      onOpenIndexChange(openIndex - 1);
    }
  };

  const canAuthor = contextType !== null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{t("actions")}</h2>
        <p className="text-xs text-gray-500">{t("actions_panel_hint")}</p>
      </div>

      {!canAuthor && (
        <Alert>
          <AlertDescription>
            {t("actions_subject_unsupported")}
          </AlertDescription>
        </Alert>
      )}

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
            <p className="mb-3 text-xs text-gray-500">
              {t("actions_empty_hint")}
            </p>
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
                      onRenameLinkId={(id, linkId) =>
                        dispatch({ type: "renameLinkId", id, linkId })
                      }
                      onMarkRequired={(id) =>
                        dispatch({
                          type: "updateQuestion",
                          id,
                          patch: { required: true },
                        })
                      }
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
