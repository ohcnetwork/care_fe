import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { BuilderEmptyState } from "@/components/QuestionnaireV2/builder/BuilderEmptyState";
import {
  BuilderState,
  builderReducer,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import { BuilderTreeNav } from "@/components/QuestionnaireV2/builder/BuilderTreeNav";
import { EditPreviewToggle } from "@/components/QuestionnaireV2/builder/EditPreviewToggle";
import { ImportQuestionsDialog } from "@/components/QuestionnaireV2/builder/ImportQuestionsDialog";
import { QuestionEditorCard } from "@/components/QuestionnaireV2/builder/QuestionEditorCard";
import { findFirstInvalidQuestion } from "@/components/QuestionnaireV2/builder/saveValidation";
import { useUpdateQuestionnaire } from "@/components/QuestionnaireV2/manage/useUpdateQuestionnaire";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { QuestionnaireRenderer } from "@/components/QuestionnaireV2/renderer/QuestionnaireRenderer";
import { buildUpdateBody } from "@/components/QuestionnaireV2/shared/buildUpdateBody";
import {
  findQuestionNumber,
  findTopLevelIndex,
  numberQuestions,
} from "@/components/QuestionnaireV2/shared/questionTree";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

const INITIAL_STATE: BuilderState = {
  questions: [],
  selectedId: null,
  dirty: false,
};

export function QuestionnaireBuilderPage({
  scope,
  id,
}: {
  scope: QuestionnaireScope;
  id: string;
}) {
  const { t } = useTranslation();

  const {
    data: questionnaire,
    isLoading,
    isError,
  } = useQuery({
    queryKey: questionnaireKeys.detail(id),
    queryFn: query(questionnaireApi.get, { pathParams: { id } }),
  });

  const [state, dispatch] = useReducer(builderReducer, INITIAL_STATE);

  useEffect(() => {
    // Skip while the user has unsaved edits (`state.dirty`) — otherwise a
    // background refetch that returns a new `questionnaire` reference (e.g.
    // refetchOnReconnect after a network blip) would silently discard them.
    // The post-save path resets explicitly (see the mutation's onSuccess
    // below) after dirty has already been cleared, so this guard doesn't
    // block that path.
    if (questionnaire && !state.dirty) {
      dispatch({
        type: "reset",
        questions: questionnaire.questions,
        keepSelectedId: state.selectedId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionnaire]);

  const [queryParams, setQueryParams] = useQueryParams();
  const { mode, import: importParam } = queryParams;
  const [view, setView] = useState<"edit" | "preview">(
    mode === "preview" ? "preview" : "edit",
  );
  const [importOpen, setImportOpen] = useState(importParam === "1");

  useEffect(() => {
    // The dialog's open state above already captured `?import=1` — strip it
    // from the URL (preserving any other params, e.g. `mode`) so a refresh
    // or Back navigation doesn't reopen the dialog.
    if (importParam !== "1") return;
    const { import: _import, ...rest } = queryParams;
    setQueryParams(rest, { overwrite: true, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useNavigationPrompt(state.dirty, t("unsaved_changes_warning"));

  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);

  // Stable identity across unrelated re-renders (e.g. isPending flips) —
  // QuestionnaireRendererProvider re-seeds (wiping in-progress preview
  // answers) whenever this object's identity changes, so it must only change
  // when the draft actually does.
  const previewQuestionnaire = useMemo(
    () =>
      questionnaire
        ? { ...questionnaire, questions: state.questions }
        : undefined,
    [questionnaire, state.questions],
  );

  // Owns the setQueryData-before-invalidate cache sequence and the success
  // toast (see the hook's doc comment); onSaved keeps the user's place in
  // the editor instead of bouncing to question 1.
  const { mutate: save, isPending } = useUpdateQuestionnaire(id, (updated) =>
    dispatch({
      type: "reset",
      questions: updated.questions,
      keepSelectedId: state.selectedId,
    }),
  );

  const backPath = `${scope.basePath}/${id}`;

  const handleSave = () => {
    if (!questionnaire) return;

    // Rules live in saveValidation.ts; the first failing question is
    // selected and shown in edit view so the author can fix it.
    const invalid = findFirstInvalidQuestion(state.questions);
    if (invalid) {
      toast.error(t(invalid.messageKey));
      dispatch({ type: "select", id: invalid.question.id });
      setView("edit");
      return;
    }

    save(buildUpdateBody(questionnaire, { questions: state.questions }));
  };

  // isPermissionLoading folds in so write affordances (Save Changes, Import)
  // don't pop in after the facility query resolves.
  if (isLoading || isPermissionLoading) {
    return <FormSkeleton rows={10} />;
  }

  if (isError || !questionnaire) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertTitle>{t("error")}</AlertTitle>
          <AlertDescription>{t("no_data_found")}</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => navigate(scope.basePath)}>
          <ArrowLeft className="size-4" />
          {t("back")}
        </Button>
      </div>
    );
  }

  const selectedQuestion = state.selectedId
    ? findQuestion(state.questions, state.selectedId)
    : undefined;
  const topLevelIndex = state.selectedId
    ? findTopLevelIndex(state.questions, state.selectedId)
    : 0;
  const canGoPrevious = topLevelIndex > 0;
  const canGoNext = topLevelIndex < state.questions.length - 1;
  // The selected question's own dotted number (e.g. "3.1." for a nested
  // child) — falls back to the top-level ancestor's ordinal for questions
  // nested deeper than `findQuestionNumber` numbers (grandchildren+).
  const selectedNumber =
    (state.selectedId &&
      findQuestionNumber(state.questions, state.selectedId)) ||
    `${topLevelIndex + 1}.`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={() => navigate(backPath)}
          >
            <ArrowLeft className="size-4" />
            {t("back")}
          </Button>
          <EditPreviewToggle view={view} onChange={setView} />
        </div>
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="link"
            className="underline"
            onClick={() => navigate(backPath)}
          >
            {t("cancel")}
          </Button>
          {canWrite && (
            <Button
              type="button"
              onClick={handleSave}
              disabled={!state.dirty || isPending}
            >
              <Check className="size-4" />
              {t("save_changes")}
            </Button>
          )}
        </div>
      </div>

      {view === "edit" ? (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="hidden w-72 shrink-0 self-start md:sticky md:top-4 md:block md:max-h-[calc(100vh-2rem)] md:overflow-y-auto">
            <BuilderTreeNav
              title={questionnaire.title}
              questions={state.questions}
              selectedId={state.selectedId}
              dispatch={dispatch}
            />
          </div>
          {/* Mobile fallback for the tree nav (hidden below md) — without it
              a phone user who drills into a nested sub-question has no way
              back to the parent or its siblings. */}
          {state.questions.length > 0 && (
            <div className="md:hidden">
              <Select
                value={state.selectedId ?? undefined}
                onValueChange={(selectedId) =>
                  dispatch({ type: "select", id: selectedId })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("select_question")} />
                </SelectTrigger>
                <SelectContent>
                  {numberQuestions(state.questions).flatMap((item) =>
                    [item, ...item.children].map(({ question, number }) => (
                      <SelectItem key={question.id} value={question.id}>
                        {number} {question.text || t("untitled_question")}
                      </SelectItem>
                    )),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-4">
            {selectedQuestion ? (
              <QuestionEditorCard
                question={selectedQuestion}
                number={selectedNumber}
                allQuestions={state.questions}
                dispatch={dispatch}
              />
            ) : (
              <BuilderEmptyState
                onAddFirst={() =>
                  dispatch({ type: "addQuestion", parentId: null })
                }
                onImport={canWrite ? () => setImportOpen(true) : undefined}
              />
            )}

            {state.questions.length > 0 && (
              <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-gray-200 bg-white px-2 py-3 sm:px-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  disabled={!canGoPrevious}
                  aria-label={t("previous")}
                  onClick={() =>
                    dispatch({
                      type: "select",
                      id: state.questions[topLevelIndex - 1].id,
                    })
                  }
                >
                  <ChevronLeft className="size-4" />
                  <span className="hidden sm:inline">{t("previous")}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline_primary"
                  className="min-w-0 flex-1"
                  onClick={() =>
                    dispatch({ type: "addQuestion", parentId: null })
                  }
                >
                  <Plus className="size-4" />
                  {t("add_new_question")}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  disabled={!canGoNext}
                  aria-label={t("next")}
                  onClick={() =>
                    dispatch({
                      type: "select",
                      id: state.questions[topLevelIndex + 1].id,
                    })
                  }
                >
                  <span className="hidden sm:inline">{t("next")}</span>
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        previewQuestionnaire && (
          <QuestionnaireRenderer
            questionnaire={previewQuestionnaire}
            mode="preview"
            subject={{ facilityId: scope.facilityId }}
          />
        )
      )}

      {/* canWrite also guards the ?import=1 deep link for read-only users. */}
      {canWrite && (
        <ImportQuestionsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={(questions) => {
            dispatch({ type: "replaceAll", questions });
            toast.success(t("questionnaire_imported_successfully"));
          }}
        />
      )}
    </div>
  );
}
