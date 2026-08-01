import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
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

import { cn } from "@/lib/utils";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { BuilderEmptyState } from "@/components/QuestionnaireV2/builder/BuilderEmptyState";
import {
  BuilderState,
  builderReducer,
  findQuestion,
} from "@/components/QuestionnaireV2/builder/builderReducer";
import { ImportQuestionsDialog } from "@/components/QuestionnaireV2/builder/ImportQuestionsDialog";
import { QuestionEditorCard } from "@/components/QuestionnaireV2/builder/QuestionEditorCard";
import {
  findFirstInvalidQuestion,
  findInvalidQuestions,
} from "@/components/QuestionnaireV2/builder/saveValidation";
import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";
import {
  DetailFormValues,
  questionnaireBasicSchema,
} from "@/components/QuestionnaireV2/manage/questionnaireFormSchema";
import { useUpdateQuestionnaire } from "@/components/QuestionnaireV2/manage/useUpdateQuestionnaire";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
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

import { useQuery } from "@tanstack/react-query";

import { FormSettingsPanel } from "./FormSettingsPanel";
import { StudioCanvas } from "./StudioCanvas";
import { StudioOutline } from "./StudioOutline";
import { StudioTopBar } from "./StudioTopBar";

const INITIAL_STATE: BuilderState = {
  questions: [],
  selectedId: null,
  dirty: false,
};

/**
 * The WYSIWYG questionnaire builder: left outline, live canvas rendered by
 * the full renderer (form/), right inspector. Replaces the old
 * QuestionnaireBuilderPage on the same routes and keeps its contracts: all
 * edit state in builderReducer, `?mode=preview` / `?import=1` params, the
 * dirty-guarded re-seed, save through `buildUpdateBody` as one full PUT —
 * now including the questionnaire metadata edited in Form settings.
 */
export function QuestionnaireStudioPage({
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
    // block that path. The metadata form protects itself the same way via
    // its `values` binding + `keepDirtyValues`.
    if (questionnaire && !state.dirty) {
      dispatch({
        type: "reset",
        questions: questionnaire.questions,
        keepSelectedId: state.selectedId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionnaire]);

  const metaSchema = useMemo(() => questionnaireBasicSchema(t), [t]);
  const form = useForm<DetailFormValues>({
    resolver: zodResolver(metaSchema),
    values: questionnaire
      ? {
          title: questionnaire.title,
          slug: questionnaire.slug,
          description: questionnaire.description ?? "",
          status: questionnaire.status,
        }
      : undefined,
    resetOptions: { keepDirtyValues: true },
  });

  const [queryParams, setQueryParams] = useQueryParams();
  const { mode, import: importParam } = queryParams;
  const [view, setView] = useState<"edit" | "preview">(
    mode === "preview" ? "preview" : "edit",
  );
  const [importOpen, setImportOpen] = useState(importParam === "1");
  const [inspectorTarget, setInspectorTarget] = useState<"form" | "question">(
    "question",
  );
  const [scrollRequest, setScrollRequest] = useState<{
    id: string;
    nonce: number;
  } | null>(null);

  useEffect(() => {
    // The dialog's open state above already captured `?import=1` — strip it
    // from the URL (preserving any other params, e.g. `mode`) so a refresh
    // or Back navigation doesn't reopen the dialog.
    if (importParam !== "1") return;
    const { import: _import, ...rest } = queryParams;
    setQueryParams(rest, { overwrite: true, replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dirty = state.dirty || form.formState.isDirty;
  useNavigationPrompt(dirty, t("unsaved_changes_warning"));

  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);

  // Creating or importing questions selects them in the reducer — the
  // inspector must follow, or it would stay on Form settings showing
  // nothing about the question that just appeared.
  const studioDispatch: typeof dispatch = (action) => {
    if (
      action.type === "addQuestion" ||
      action.type === "duplicateQuestion" ||
      action.type === "replaceAll"
    ) {
      setInspectorTarget("question");
    }
    dispatch(action);
  };

  // Live draft for the canvas: a fresh identity per edit is exactly what
  // drives the form provider's live sync (it merges responses rather than
  // wiping them, so this is safe on every keystroke). Title/description
  // ride along from the metadata form so the canvas header is as realtime
  // as the questions.
  const [metaTitle, metaDescription] = useWatch({
    control: form.control,
    name: ["title", "description"],
  });
  const draft = useMemo(
    () =>
      questionnaire
        ? {
            ...questionnaire,
            title: metaTitle || questionnaire.title,
            description: metaDescription ?? questionnaire.description,
            questions: state.questions,
          }
        : undefined,
    [questionnaire, state.questions, metaTitle, metaDescription],
  );

  const issues = useMemo(
    () => findInvalidQuestions(state.questions),
    [state.questions],
  );

  const { mutate: save, isPending } = useUpdateQuestionnaire(id, (updated) => {
    dispatch({
      type: "reset",
      questions: updated.questions,
      keepSelectedId: state.selectedId,
    });
    form.reset({
      title: updated.title,
      slug: updated.slug,
      description: updated.description ?? "",
      status: updated.status,
    });
  });

  const backPath = `${scope.basePath}/${id}`;

  const revealQuestion = (questionId: string) => {
    dispatch({ type: "select", id: questionId });
    setInspectorTarget("question");
    setScrollRequest((previous) => ({
      id: questionId,
      nonce: (previous?.nonce ?? 0) + 1,
    }));
  };

  const handleSave = () => {
    if (!questionnaire) return;

    // Question-tree rules first (saveValidation.ts) — the first failing
    // question is selected and shown in edit view so the author can fix it.
    const invalid = findFirstInvalidQuestion(state.questions);
    if (invalid) {
      toast.error(t(invalid.messageKey));
      setView("edit");
      revealQuestion(invalid.question.id);
      return;
    }

    form.handleSubmit(
      (meta) =>
        save(
          buildUpdateBody(questionnaire, {
            questions: state.questions,
            title: meta.title,
            slug: meta.slug,
            description: meta.description,
            status: meta.status,
          }),
        ),
      () => {
        // Metadata invalid (e.g. slug out of bounds) — surface the fields.
        setView("edit");
        setInspectorTarget("form");
        toast.error(t("form_settings_invalid"));
      },
    )();
  };

  const handleDiscard = () => {
    if (!questionnaire) return;
    dispatch({
      type: "reset",
      questions: questionnaire.questions,
      keepSelectedId: state.selectedId,
    });
    form.reset({
      title: questionnaire.title,
      slug: questionnaire.slug,
      description: questionnaire.description ?? "",
      status: questionnaire.status,
    });
  };

  // isPermissionLoading folds in so write affordances (Save Changes, Import)
  // don't pop in after the facility query resolves.
  if (isLoading || isPermissionLoading) {
    return <FormSkeleton rows={10} />;
  }

  if (isError || !questionnaire || !draft) {
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
  const formSelected = inspectorTarget === "form" || !selectedQuestion;
  const editing = view === "edit";
  const topLevelIndex = state.selectedId
    ? findTopLevelIndex(state.questions, state.selectedId)
    : 0;
  // The selected question's own dotted number (e.g. "3.1." for a nested
  // child) — falls back to the top-level ancestor's ordinal for questions
  // nested deeper than `findQuestionNumber` numbers (grandchildren+).
  const selectedNumber =
    (state.selectedId &&
      findQuestionNumber(state.questions, state.selectedId)) ||
    `${topLevelIndex + 1}.`;

  return (
    <QuestionnaireFormProvider
      questionnaire={draft}
      mode="preview"
      subject={{ facilityId: scope.facilityId }}
      revealHidden={editing}
      inert={editing}
    >
      <div className="flex flex-col">
        <div className="sticky top-0 z-30 bg-white">
          <StudioTopBar
            questionnaire={questionnaire}
            questions={state.questions}
            view={view}
            onViewChange={setView}
            issues={issues}
            onSelectIssue={(questionId) => {
              setView("edit");
              revealQuestion(questionId);
            }}
            dirty={dirty}
            isSaving={isPending}
            canWrite={canWrite}
            onSave={handleSave}
            onDiscard={handleDiscard}
            backPath={backPath}
          />
        </div>

        {/* Mobile fallback for the outline (hidden below md) — without it a
            phone user who drills into a nested sub-question has no way back
            to the parent or its siblings. */}
        {editing && state.questions.length > 0 && (
          <div className="flex items-center gap-2 pt-4 md:hidden">
            <div className="min-w-0 flex-1">
              <Select
                value={state.selectedId ?? undefined}
                onValueChange={(selectedId) => {
                  dispatch({ type: "select", id: selectedId });
                  setInspectorTarget("question");
                }}
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
            {/* Below md the outline (and its add affordances) is hidden and
                the canvas with its append zones only exists at lg — this is
                the one add-question path on a phone. */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0"
              aria-label={t("add_new_question")}
              onClick={() =>
                studioDispatch({ type: "addQuestion", parentId: null })
              }
            >
              <Plus className="size-4" />
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-start">
          <div className="order-1 hidden w-72 shrink-0 md:sticky md:top-20 md:block md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
            <StudioOutline
              questions={state.questions}
              editing={editing}
              selectedId={state.selectedId}
              formSelected={editing && formSelected}
              onSelectForm={() => setInspectorTarget("form")}
              onSelectQuestion={revealQuestion}
              dispatch={studioDispatch}
            />
          </div>

          {/* The inspector sits BEFORE the canvas in DOM (visual order via
              flex order-*): the type picker stays the first combobox on the
              editor surface regardless of what the canvas renders. */}
          {editing && (
            <div className="order-2 w-full min-w-0 space-y-4 md:w-[400px] md:shrink-0 lg:order-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-4">
              {formSelected ? (
                <FormSettingsPanel
                  scope={scope}
                  questionnaire={questionnaire}
                  form={form}
                  canWrite={canWrite}
                  exportQuestionnaire={() => ({
                    ...questionnaire,
                    ...form.getValues(),
                    questions: state.questions,
                  })}
                />
              ) : (
                <QuestionEditorCard
                  question={selectedQuestion}
                  number={selectedNumber}
                  allQuestions={state.questions}
                  dispatch={dispatch}
                />
              )}
            </div>
          )}

          <div
            className={cn(
              "min-w-0 flex-1 lg:order-2",
              editing && "hidden lg:block",
            )}
          >
            <StudioCanvas
              editing={editing}
              // Cleared while Form settings is the inspector target so the
              // ring/toolbar don't advertise a question as "editing" that
              // the inspector no longer shows.
              selectedId={editing && formSelected ? null : state.selectedId}
              onSelectQuestion={(questionId) => {
                dispatch({ type: "select", id: questionId });
                setInspectorTarget("question");
              }}
              dispatch={studioDispatch}
              scrollRequest={scrollRequest}
              emptyState={
                editing ? (
                  <BuilderEmptyState
                    onAddFirst={() =>
                      studioDispatch({ type: "addQuestion", parentId: null })
                    }
                    onImport={canWrite ? () => setImportOpen(true) : undefined}
                  />
                ) : undefined
              }
            />
          </div>
        </div>
      </div>

      {/* canWrite also guards the ?import=1 deep link for read-only users. */}
      {canWrite && (
        <ImportQuestionsDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          onImport={(questions) => {
            studioDispatch({ type: "replaceAll", questions });
            toast.success(t("questionnaire_imported_successfully"));
          }}
        />
      )}
    </QuestionnaireFormProvider>
  );
}
