import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListChecks,
  LucideIcon,
  Plus,
  SquarePen,
  Upload,
} from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import {
  BuilderState,
  builderReducer,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import { BuilderTreeNav } from "@/components/QuestionnaireV2/builder/BuilderTreeNav";
import { QuestionEditorCard } from "@/components/QuestionnaireV2/builder/QuestionEditorCard";
import { buildUpdateBody } from "@/components/QuestionnaireV2/manage/buildUpdateBody";
import { ImportQuestionsDialog } from "@/components/QuestionnaireV2/manage/ImportQuestionsDialog";
import { QuestionnaireRenderer } from "@/components/QuestionnaireV2/renderer/QuestionnaireRenderer";
import {
  findQuestionNumber,
  findTopLevelIndex,
} from "@/components/QuestionnaireV2/shared/QuestionTreeNav";

import { cn } from "@/lib/utils";

import { Question } from "@/types/questionnaire/question";
import {
  QuestionnaireRead,
  QuestionnaireScope,
} from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import mutate from "@/Utils/request/mutate";
import query from "@/Utils/request/query";

const INITIAL_STATE: BuilderState = {
  questions: [],
  selectedId: null,
  dirty: false,
};

/** Depth-first search for the first question with blank text. */
function findFirstBlankTitle(questions: Question[]): Question | undefined {
  for (const question of questions) {
    if (!question.text.trim()) return question;
    const found = findFirstBlankTitle(question.questions ?? []);
    if (found) return found;
  }
  return undefined;
}

/** Depth-first search for the first group question with no children. */
function findFirstEmptyGroup(questions: Question[]): Question | undefined {
  for (const question of questions) {
    if (question.type === "group" && (question.questions?.length ?? 0) === 0) {
      return question;
    }
    const found = findFirstEmptyGroup(question.questions ?? []);
    if (found) return found;
  }
  return undefined;
}

interface EditPreviewToggleProps {
  view: "edit" | "preview";
  onChange: (view: "edit" | "preview") => void;
}

function EditPreviewToggle({ view, onChange }: EditPreviewToggleProps) {
  const { t } = useTranslation();

  const pill = (value: "edit" | "preview", label: string, Icon: LucideIcon) => (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
        view === value
          ? "bg-white text-gray-900 shadow-sm"
          : "text-gray-500 hover:text-gray-700",
      )}
    >
      <Icon className="size-4" />
      {label}
    </button>
  );

  return (
    <div className="flex items-center gap-1 rounded-full bg-gray-100 p-1">
      {pill("edit", t("edit"), SquarePen)}
      {pill("preview", t("preview"), Eye)}
    </div>
  );
}

function BuilderEmptyState({
  onAddFirst,
  onImport,
}: {
  onAddFirst: () => void;
  onImport: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-6 py-16 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-primary/10">
        <ListChecks className="size-6 text-primary" />
      </div>
      <p className="text-sm font-medium text-gray-900">
        {t("no_questions_added_yet")}
      </p>
      <Button type="button" variant="outline_primary" onClick={onAddFirst}>
        <Plus className="size-4" />
        {t("add_first_question")}
      </Button>
      <div className="flex w-full max-w-xs items-center gap-2 text-xs font-medium uppercase text-gray-400">
        <span className="h-px flex-1 bg-gray-200" />
        {t("or")}
        <span className="h-px flex-1 bg-gray-200" />
      </div>
      <Button type="button" variant="outline" onClick={onImport}>
        <Upload className="size-4" />
        {t("import_questions")}
      </Button>
    </div>
  );
}

export function QuestionnaireBuilderPage({
  scope,
  id,
}: {
  scope: QuestionnaireScope;
  id: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const {
    data: questionnaire,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["questionnairesV2", "detail", id],
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
      dispatch({ type: "reset", questions: questionnaire.questions });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionnaire]);

  const [{ mode, import: importParam }] = useQueryParams();
  const [view, setView] = useState<"edit" | "preview">(
    mode === "preview" ? "preview" : "edit",
  );
  const [importOpen, setImportOpen] = useState(importParam === "1");

  useEffect(() => {
    // The dialog's open state above already captured `?import=1` — strip it
    // from the URL (preserving any other params, e.g. `mode`) so a refresh
    // or Back navigation doesn't reopen the dialog.
    if (importParam !== "1") return;
    const params = new URLSearchParams(window.location.search);
    params.delete("import");
    const search = params.toString();
    navigate(`${scope.basePath}/${id}/edit${search ? `?${search}` : ""}`, {
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useNavigationPrompt(state.dirty, t("unsaved_changes_warning"));

  const { mutate: save, isPending } = useMutation({
    mutationFn: mutate(questionnaireApi.update, { pathParams: { id } }),
    onSuccess: (updated: QuestionnaireRead) => {
      queryClient.invalidateQueries({ queryKey: ["questionnairesV2"] });
      toast.success(t("questionnaire_updated_successfully"));
      dispatch({ type: "reset", questions: updated.questions });
    },
  });

  const backPath = `${scope.basePath}/${id}`;

  const handleSave = () => {
    if (!questionnaire) return;

    const blankTitle = findFirstBlankTitle(state.questions);
    if (blankTitle) {
      toast.error(t("question_titles_required"));
      dispatch({ type: "select", id: blankTitle.id });
      setView("edit");
      return;
    }

    const emptyGroup = findFirstEmptyGroup(state.questions);
    if (emptyGroup) {
      toast.error(t("group_needs_subquestion"));
      dispatch({ type: "select", id: emptyGroup.id });
      setView("edit");
      return;
    }

    save(buildUpdateBody(questionnaire, { questions: state.questions }));
  };

  if (isLoading) {
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
          <Button
            type="button"
            onClick={handleSave}
            disabled={!state.dirty || isPending}
          >
            <Check className="size-4" />
            {t("save_changes")}
          </Button>
        </div>
      </div>

      {view === "edit" ? (
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="hidden w-72 shrink-0 md:block">
            <BuilderTreeNav
              title={questionnaire.title}
              questions={state.questions}
              selectedId={state.selectedId}
              dispatch={dispatch}
            />
          </div>
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
                onImport={() => setImportOpen(true)}
              />
            )}

            {state.questions.length > 0 && (
              <div className="sticky bottom-0 flex items-center gap-2 border-t border-gray-200 bg-white px-4 py-3">
                <Button
                  type="button"
                  variant="ghost"
                  disabled={!canGoPrevious}
                  onClick={() =>
                    dispatch({
                      type: "select",
                      id: state.questions[topLevelIndex - 1].id,
                    })
                  }
                >
                  <ChevronLeft className="size-4" />
                  {t("previous")}
                </Button>
                <Button
                  type="button"
                  variant="outline_primary"
                  className="flex-1"
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
                  disabled={!canGoNext}
                  onClick={() =>
                    dispatch({
                      type: "select",
                      id: state.questions[topLevelIndex + 1].id,
                    })
                  }
                >
                  {t("next")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <QuestionnaireRenderer
          questionnaire={{ ...questionnaire, questions: state.questions }}
          mode="preview"
          subject={{ facilityId: scope.facilityId }}
        />
      )}

      <ImportQuestionsDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(questions) => {
          dispatch({ type: "replaceAll", questions });
          toast.success(t("questionnaire_imported_successfully"));
        }}
      />
    </div>
  );
}
