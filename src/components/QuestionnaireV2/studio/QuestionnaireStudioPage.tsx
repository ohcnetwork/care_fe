import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { navigate, useNavigationPrompt, useQueryParams } from "raviger";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

import { FormSkeleton } from "@/components/Common/SkeletonLoading";

import { findActionIssues } from "@/components/QuestionnaireV2/builder/actionValidation";
import { BuilderEmptyState } from "@/components/QuestionnaireV2/builder/BuilderEmptyState";
import { ImportQuestionsDialog } from "@/components/QuestionnaireV2/builder/ImportQuestionsDialog";

import { findFirstInvalidQuestion } from "@/components/QuestionnaireV2/builder/saveValidation";
import { QuestionnaireFormProvider } from "@/components/QuestionnaireV2/form/FormContext";
import { questionnaireKeys } from "@/components/QuestionnaireV2/queryKeys";
import { useCanWriteQuestionnaire } from "@/components/QuestionnaireV2/useCanWriteQuestionnaire";

import { actionContextTypeFor } from "@/types/questionnaire/actions";
import { QuestionnaireScope } from "@/types/questionnaire/questionnaire";
import questionnaireApi from "@/types/questionnaire/questionnaireApi";
import { valueSetScopeForFacility } from "@/types/valueSet/valueSet";
import query from "@/Utils/request/query";

import { ActionsPanel } from "./ActionsPanel";
import { FormSettingsPanel } from "./FormSettingsPanel";
import { QuestionInspector } from "./QuestionInspector";
import { StudioCanvas } from "./StudioCanvas";
import { StudioMobileQuestionNav } from "./StudioMobileQuestionNav";
import { StudioOutline } from "./StudioOutline";
import { StudioTopBar } from "./StudioTopBar";
import { useStudioDraft } from "./useStudioDraft";
import { useStudioIssues } from "./useStudioIssues";
import { useStudioSelection } from "./useStudioSelection";

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

  const {
    state,
    dispatch,
    form,
    draft,
    organizationDraft,
    setOrganizationDraft,
    dirty,
    isPending,
    saveDraft,
    discardDraft,
  } = useStudioDraft({ id, scope, questionnaire });
  const {
    studioDispatch,
    setInspectorTarget,
    openActionIndex,
    setOpenActionIndex,
    scrollRequest,
    selectQuestion,
    revealQuestion,
    revealAction,
    selectedQuestion,
    selectedNumber,
    panel,
    formSelected,
  } = useStudioSelection(state, dispatch);
  const {
    issues,
    issueKeysByQuestionId,
    registry,
    contextPaths,
    actionIssues,
    actionLinkIds,
  } = useStudioIssues({
    questions: state.questions,
    actions: state.actions,
    subjectType: questionnaire?.subject_type,
  });

  const [queryParams, setQueryParams] = useQueryParams();
  const { mode, import: importParam } = queryParams;
  const [requestedView, setView] = useState<"edit" | "preview">(
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

  useNavigationPrompt(dirty, t("unsaved_changes_warning"));

  const { canWrite, isLoading: isPermissionLoading } =
    useCanWriteQuestionnaire(scope);

  // Read-only users get preview only — including on an `/edit` deep link.
  // The edit surface has nothing to save through (StudioTopBar hides Save and
  // Discard), so offering it would collect edits that can never be persisted
  // and then prompt about them on the way out.
  const view = canWrite ? requestedView : "preview";

  const backPath = `${scope.basePath}/${id}`;

  // Stable identity — the provider's context value is keyed on it, so an
  // inline literal would re-render every consumer of the form context on
  // each keystroke.
  const rendererSubject = useMemo(
    () => ({ facilityId: scope.facilityId }),
    [scope.facilityId],
  );

  // Valuesets created from the inspector are filed under the mount's own auth
  // context: instance-context creation is superuser-only, so a facility mount
  // authoring an instance valueset would 403 for every facility admin.
  const valueSetScope = useMemo(
    () => valueSetScopeForFacility(scope.facilityId),
    [scope.facilityId],
  );

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

    // Then the actions' rules — the failing action is opened in the panel.
    const actionIssue = findActionIssues(state.actions, {
      questions: state.questions,
      instructions: registry.instructions,
      contextPaths,
    })[0];
    if (actionIssue) {
      toast.error(t(actionIssue.messageKey));
      setView("edit");
      revealAction(actionIssue.index);
      return;
    }

    form.handleSubmit(saveDraft, () => {
      // Metadata invalid (e.g. slug out of bounds) — surface the fields.
      setView("edit");
      setInspectorTarget("form");
      toast.error(t("form_settings_invalid"));
    })();
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

  const editing = view === "edit";

  return (
    <QuestionnaireFormProvider
      questionnaire={draft}
      mode="preview"
      subject={rendererSubject}
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
            actionIssues={actionIssues}
            onSelectActionIssue={(index) => {
              setView("edit");
              revealAction(index);
            }}
            dirty={dirty}
            isSaving={isPending}
            canWrite={canWrite}
            onSave={handleSave}
            onDiscard={discardDraft}
            backPath={backPath}
          />
        </header>

        {/* Mobile fallback for the outline (hidden below md) — without it a
            phone user who drills into a nested sub-question has no way back
            to the parent or its siblings. */}
        {editing && state.questions.length > 0 && (
          <StudioMobileQuestionNav
            questions={state.questions}
            selectedId={state.selectedId}
            onSelectQuestion={selectQuestion}
            onAddQuestion={() =>
              studioDispatch({ type: "addQuestion", parentId: null })
            }
          />
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
              actionsRow={
                actionContextTypeFor(questionnaire.subject_type) !== null ||
                state.actions.length > 0
              }
              actionsSelected={editing && panel === "actions"}
              actionCount={state.actions.length}
              actionsHaveIssues={actionIssues.length > 0}
              actionLinkIds={actionLinkIds}
              onSelectActions={() => setInspectorTarget("actions")}
              onSelectQuestion={revealQuestion}
              dispatch={studioDispatch}
            />
          </aside>

          {/* The inspector sits BEFORE the canvas in DOM (visual order via
              flex order-*): the type picker stays the first combobox on the
              editor surface regardless of what the canvas renders. */}
          {editing && (
            <aside className="order-2 w-full min-w-0 space-y-4 overflow-y-auto p-3 md:flex-1 lg:order-3 lg:w-[400px] lg:flex-none lg:border-l lg:border-gray-200">
              {panel === "actions" ? (
                <ActionsPanel
                  subjectType={questionnaire.subject_type}
                  questions={state.questions}
                  actions={state.actions}
                  issues={actionIssues}
                  openIndex={openActionIndex}
                  onOpenIndexChange={setOpenActionIndex}
                  registry={registry}
                  facilityId={scope.facilityId}
                  dispatch={dispatch}
                />
              ) : formSelected ? (
                <FormSettingsPanel
                  scope={scope}
                  questionnaire={questionnaire}
                  form={form}
                  canWrite={canWrite}
                  isSaving={isPending}
                  organizationDraft={organizationDraft}
                  onOrganizationsChange={setOrganizationDraft}
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
                  key={selectedQuestion!.id}
                  question={selectedQuestion!}
                  number={selectedNumber}
                  allQuestions={state.questions}
                  subjectType={questionnaire.subject_type}
                  valueSetScope={valueSetScope}
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
              // Cleared while Form settings or Actions is the inspector
              // target so the ring/toolbar don't advertise a question as
              // "editing" that the inspector no longer shows.
              selectedId={
                editing && panel !== "question" ? null : state.selectedId
              }
              onSelectQuestion={selectQuestion}
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
          onImport={(questions, linkIdMap) => {
            studioDispatch({ type: "replaceAll", questions, linkIdMap });
            toast.success(t("questionnaire_imported_successfully"));
          }}
        />
      )}
    </QuestionnaireFormProvider>
  );
}
