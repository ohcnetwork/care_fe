import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Plus } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import {
  useDeferredValue,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
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
import {
  getStructuredTypesVersion,
  subscribeToStructuredTypes,
} from "@/components/QuestionnaireV2/structured/pluginRegistry";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import query from "@/Utils/request/query";

import { useQuery } from "@tanstack/react-query";

import { FormSettingsPanel } from "./FormSettingsPanel";
import { QuestionInspector } from "./QuestionInspector";
import { StudioCanvas } from "./StudioCanvas";
import { StudioOutline } from "./StudioOutline";
import { StudioTopBar } from "./StudioTopBar";

const INITIAL_STATE: BuilderState = {
  questions: [],
  selectedId: null,
  dirty: false,
};

/**
 * WYSIWYG questionnaire builder: left outline, live form canvas, and right
 * inspector. Edit state lives in `builderReducer`; saves use `buildUpdateBody`
 * as one full PUT including questionnaire metadata from Form settings.
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

  const [state, reactDispatch] = useReducer(builderReducer, INITIAL_STATE);

  // Counts user edits only, letting `onSaved` detect whether anything changed
  // while the PUT was in flight. Resets are exempt because they come from load,
  // background re-seed, Discard and post-save synchronization.
  const dispatchSeqRef = useRef(0);
  const dispatch: typeof reactDispatch = (action) => {
    if (action.type !== "reset") {
      dispatchSeqRef.current += 1;
    }
    reactDispatch(action);
  };

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

  // The unknown-structured-type rule reads the plugin registry, which fills
  // in only after the federation manifests resolve — later than the first
  // render of a cold-loaded questionnaire. Without re-running on that, a
  // plugin-typed question would show false "Unknown structured type"
  // warnings (outline icons, canvas chips, issues popover) until an edit
  // happened to invalidate the memo.
  const structuredTypesVersion = useSyncExternalStore(
    subscribeToStructuredTypes,
    getStructuredTypesVersion,
    getStructuredTypesVersion,
  );
  // `findInvalidQuestions` walks the whole question tree with every save
  // rule on every render — a full DFS + per-rule scans on EACH keystroke,
  // since `state.questions` gets a fresh identity per dispatch. Deferring
  // the input lets typing stay unblocked while this recompute lags a tick
  // behind; it feeds only the issues POPOVER/outline warnings display, not
  // Save's gating — `handleSave` below calls `findFirstInvalidQuestion`
  // directly on the live (non-deferred) `state.questions`, so a click
  // always blocks on the CURRENT tree even while this memo is still
  // catching up.
  const deferredQuestions = useDeferredValue(state.questions);
  const issues = useMemo(() => {
    // Referenced so the dependency is a real read, not one exhaustive-deps
    // would call spurious: the registry lookup happens inside
    // `findInvalidQuestions`, where the rule cannot see it.
    void structuredTypesVersion;
    return findInvalidQuestions(deferredQuestions);
  }, [deferredQuestions, structuredTypesVersion]);
  // First failing rule per question — powers the outline warning icons and
  // the canvas error chips alongside the top bar's popover.
  const issueKeysByQuestionId = useMemo(
    () =>
      new Map(
        issues.map(({ question, messageKey }) => [question.id, messageKey]),
      ),
    [issues],
  );

  // Snapshot of `dispatchSeqRef` taken the instant the save PUT is fired
  // (see `handleSave`) — compared against the live ref in `onSaved` below.
  const saveDispatchSeqRef = useRef(0);
  // The metadata (`title`/`slug`/`description`/`status`) actually included
  // in that same PUT — the form side's equivalent snapshot. A plain
  // `form.formState.isDirty` boolean can't do this job: it reads the same
  // `true` both before AND after a SECOND in-flight edit lands on a field
  // that was already dirty when Save was clicked (e.g. title "A" → Save →
  // still in flight → title "B"), so a before/after equality check on it
  // would miss that second edit and let the reset clobber "B". Comparing
  // the actual submitted values against the form's LIVE values instead
  // (via `form.getValues()`, an uncontrolled ref read — never stale)
  // catches every case: unchanged, changed once, or changed again.
  const saveMetaRef = useRef<DetailFormValues | null>(null);
  const metaMatches = (a: DetailFormValues, b: DetailFormValues) =>
    a.title === b.title &&
    a.slug === b.slug &&
    a.description === b.description &&
    a.status === b.status;

  const { mutate: save, isPending } = useUpdateQuestionnaire(id, (updated) => {
    // A reducer dispatch landed while this PUT was in flight (the author
    // kept editing — e.g. a question change) — `state` is now ahead of
    // what `updated` reflects, so resetting to it would silently discard
    // those in-flight edits.
    const questionsEditedDuringFlight =
      dispatchSeqRef.current !== saveDispatchSeqRef.current;
    // Same idea for the metadata form — its live values now differ from
    // what this PUT actually submitted, so resetting it would discard an
    // in-flight Form-settings edit (Title/Slug/Description/Status).
    const metaEditedDuringFlight =
      !saveMetaRef.current ||
      !metaMatches(saveMetaRef.current, form.getValues());

    // The two sides are independent: an edit to only one must not block
    // the other's reset. The cache write in useUpdateQuestionnaire's
    // onSuccess (setQueryData) already ran before this callback, so
    // metadata read straight from the query cache — the revision badge
    // and the Save button's next-version chip, both driven by the
    // `questionnaire` prop, not `state`/`form` — updates regardless of
    // what either check below decides.
    if (!questionsEditedDuringFlight) {
      dispatch({
        type: "reset",
        questions: updated.questions,
        keepSelectedId: state.selectedId,
      });
    }
    if (!metaEditedDuringFlight) {
      form.reset({
        title: updated.title,
        slug: updated.slug,
        description: updated.description ?? "",
        status: updated.status,
      });
    }
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
      (meta) => {
        // Snapshot right before the PUT fires (mutate() starts the request
        // synchronously) — any dispatch, or any form field left differing
        // from `meta` after this point, is an in-flight edit `onSaved`
        // must not clobber.
        saveDispatchSeqRef.current = dispatchSeqRef.current;
        saveMetaRef.current = meta;
        save(
          buildUpdateBody(questionnaire, {
            questions: state.questions,
            title: meta.title,
            slug: meta.slug,
            description: meta.description,
            status: meta.status,
          }),
        );
      },
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
      {/* Fullscreen shell (the route opts out of the app sidebar in
          AppRouter's PATHS_WITHOUT_SIDEBAR): the reference design's
          viewport-filling frame — fixed top bar, three independently
          scrolling columns. z-40 keeps portals (dialogs, popovers, toasts
          at z-50) above it. */}
      <div className="fixed inset-0 z-40 flex flex-col overflow-hidden bg-white">
        <header className="shrink-0">
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
        </header>

        {/* Mobile fallback for the outline (hidden below md) — without it a
            phone user who drills into a nested sub-question has no way back
            to the parent or its siblings. */}
        {editing && state.questions.length > 0 && (
          <div className="flex shrink-0 items-center gap-2 border-b border-gray-200 px-3 py-2 md:hidden">
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

        <div className="flex min-h-0 flex-1">
          <aside className="order-1 hidden w-72 shrink-0 overflow-y-auto border-r border-gray-200 p-3 md:block">
            <StudioOutline
              questions={state.questions}
              editing={editing}
              selectedId={state.selectedId}
              formSelected={editing && formSelected}
              issueKeysByQuestionId={issueKeysByQuestionId}
              onSelectForm={() => setInspectorTarget("form")}
              onSelectQuestion={revealQuestion}
              dispatch={studioDispatch}
            />
          </aside>

          {/* The inspector sits BEFORE the canvas in DOM (visual order via
              flex order-*): the type picker stays the first combobox on the
              editor surface regardless of what the canvas renders. */}
          {editing && (
            <aside className="order-2 w-full min-w-0 space-y-4 overflow-y-auto p-3 md:flex-1 lg:order-3 lg:w-[400px] lg:flex-none lg:border-l lg:border-gray-200">
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
                <QuestionInspector
                  // Keyed by question so the inspector re-anchors on the
                  // Question tab per selection — keeps the "Question Title"
                  // textbox visible when save validation or an issue click
                  // selects a question programmatically.
                  key={selectedQuestion.id}
                  question={selectedQuestion}
                  number={selectedNumber}
                  allQuestions={state.questions}
                  subjectType={questionnaire.subject_type}
                  dispatch={studioDispatch}
                />
              )}
            </aside>
          )}

          {/* A labeled region (not <main> — the app shell already provides
              the page's main landmark, and nested mains are invalid). Also
              the stable scope tests use to address the canvas append zone. */}
          <section
            aria-label={t("form_canvas")}
            className={cn(
              "min-w-0 flex-1 overflow-y-auto px-4 py-5 lg:order-2 lg:px-8",
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
              questions={state.questions}
              issueKeysByQuestionId={issueKeysByQuestionId}
              scrollRequest={scrollRequest}
              headerHint={editing ? t("click_any_question_to_edit") : undefined}
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
          </section>
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
