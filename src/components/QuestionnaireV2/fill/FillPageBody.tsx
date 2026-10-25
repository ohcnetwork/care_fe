import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Plus } from "lucide-react";
import { navigate, useNavigationPrompt } from "raviger";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import ConfirmActionDialog from "@/components/Common/ConfirmActionDialog";
import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";
import { formSubmissionKeys } from "@/components/QuestionnaireV2/queryKeys";

import { PLUGIN_Component } from "@/PluginEngine";
import { formatKeyboardShortcut } from "@/Utils/keyboardShortcutUtils";
import mutate from "@/Utils/request/mutate";
import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { FormSubmissionRead } from "@/types/questionnaire/formSubmission";
import formSubmissionApi from "@/types/questionnaire/formSubmissionApi";
import type {
  QuestionnaireRead,
  SubjectType,
} from "@/types/questionnaire/questionnaire";

import { FillFormSection } from "./FillFormSection";
import { FillHeader } from "./FillHeader";
import {
  FillOutlineNavProvider,
  FillOutlineOverlay,
} from "./FillOutlineOverlay";
import { ServerErrorsPanel } from "./ServerErrorsPanel";
import type { FormStore } from "./StoreRegistrar";
import type { DroppedDraftAnswer } from "./draft/draftMerge";
import { removeFillDraftCache } from "./draft/fillDraftCache";
import type { FillDraftScope, LoadedFillDraft } from "./draft/fillDraftStore";
import { useFillSessionAutosave } from "./draft/useFillAutosave";
import { useSaveServerDraft } from "./draft/useSaveServerDraft";
import type { FillSubject } from "./subject";
import { rendererSubjectOf } from "./subject";
import { useSubmitFillSession } from "./submit/useSubmitFillSession";
import { useFillActions } from "./useFillActions";
import { useFillSessionForms } from "./useFillSessionForms";

import { FillSessionNotices } from "./FillSessionNotices";
import { FillSessionTabs } from "./FillSessionTabs";

interface FillPageBodyProps {
  questionnaire: QuestionnaireRead;
  patient?: PatientRead;
  encounter?: EncounterRead;
  subject: FillSubject;
  pickerSubjectType: SubjectType;
  scope: FillDraftScope | undefined;
  localDraft: LoadedFillDraft | undefined;
  /** The overview's Continue action explicitly selected the local draft. */
  resumeLocalDraft?: boolean;
  /** Resumed server draft, seeded into the primary form at creation. */
  serverDraftResponses?: Record<string, QuestionnaireResponse>;
  /** Answers that resumed draft could not carry onto the current
   *  questionnaire — surfaced, never dropped silently. */
  serverDraftDropped?: DroppedDraftAnswer[];
  continueDraftId?: string;
  serverDraft?: FormSubmissionRead;
  exitTarget: string;
  contextRefreshFailed: boolean;
  isRetryingContext: boolean;
  onRetryContext: () => void;
}

/**
 * The loaded fill session: the tabbed canvas (forms, outline, autosave,
 * submit) plus the clinical-history tab where a patient exists. Mounted by
 * `QuestionnaireFillPage` only once every query and error branch has
 * resolved, so everything here can assume a loaded questionnaire.
 */
export function FillPageBody({
  questionnaire,
  patient,
  encounter,
  subject,
  pickerSubjectType,
  scope,
  localDraft,
  resumeLocalDraft = false,
  serverDraftResponses,
  serverDraftDropped,
  continueDraftId,
  serverDraft,
  exitTarget,
  contextRefreshFailed,
  isRetryingContext,
  onRetryContext,
}: FillPageBodyProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const storesRef = useRef(new Map<string, FormStore>());
  const [storesVersion, setStoresVersion] = useState(0);
  const handleStore = useCallback((key: string, store: FormStore | null) => {
    if (store) storesRef.current.set(key, store);
    else storesRef.current.delete(key);
    setStoresVersion((version) => version + 1);
  }, []);
  const getStore = useCallback((key: string) => storesRef.current.get(key), []);

  // The session: the route-mounted questionnaire plus anything added to
  // the same submission (add/remove, retained-draft-snapshot bookkeeping,
  // the async resume-added-forms path) — see useFillSessionForms.ts.
  const {
    forms,
    removeForm,
    retainedSnapshots,
    onResumeAddedForms,
    addQuestionnaireFromPicker,
  } = useFillSessionForms({
    questionnaire,
    serverDraftResponses,
    getStore,
  });

  // The primary form's `questionnaire` is captured once at session
  // creation (`useFillSessionForms`' `useState` initializer never
  // re-runs), so a background refetch updates the `questionnaire` prop
  // below without ever reaching the mounted session. Reloading — not
  // hot-swapping the rendered tree, which would race `FormContext.tsx`'s
  // live-sync effect over the same `responsesAtom` — flushes the session
  // to its local draft (the `pagehide` handler autosave installs), then
  // re-mounts against the now-current questionnaire; `loadFillDraft`'s
  // merge restores what fits and names what doesn't in the restore bar.
  // Not shown while resuming a SERVER draft (`continueDraftId`): that
  // session never persists locally, so a reload has nothing to restore
  // from.
  const primaryForm = forms.find((form) => form.isPrimary);
  const questionnaireStale =
    !!primaryForm &&
    !continueDraftId &&
    String(primaryForm.questionnaire.version) !== String(questionnaire.version);

  // The outline lives in one shared overlay (panel rows + rail ticks);
  // each form portals its own pieces into the two hosts (they must render
  // inside that form's provider). The scroll container feeds the
  // overlay's scroll-spy.
  const [outlineHost, setOutlineHost] = useState<HTMLElement | null>(null);
  const [railHost, setRailHost] = useState<HTMLElement | null>(null);
  const [scrollHost, setScrollHost] = useState<HTMLElement | null>(null);
  const [actionsHeight, setActionsHeight] = useState(0);

  // The renderer's flat subject view. Memoized on its PRIMITIVES: the
  // union arrives as a fresh object literal from the route element on
  // every render, so keying on the object itself would never hit.
  const { patientId, encounterId, facilityId, resourceId } =
    rendererSubjectOf(subject);
  const rendererSubject = useMemo(
    () => ({ patientId, encounterId, facilityId, resourceId }),
    [patientId, encounterId, facilityId, resourceId],
  );

  // Local autosave PERSISTENCE stands down while resuming a SERVER draft —
  // the server copy is authoritative there and keeps its own lifecycle.
  // The scope still goes in: dirty tracking guards navigation either way,
  // and a successful submit must clear any sibling local draft filed under
  // the same key by an earlier plain session.
  const autosave = useFillSessionAutosave({
    scope,
    persistLocally: !continueDraftId,
    forms,
    getStore,
    storesVersion,
    restoredDraft: localDraft,
    resumeAutomatically: resumeLocalDraft,
    retainedSnapshots,
    onResumeAddedForms,
  });

  // Titles of forms the draft is still carrying that never made it back
  // into a live store — a resume whose re-fetch failed, still sitting in
  // `retainedSnapshots` (see the state above). Passed to the submit hook
  // so it can refuse to submit (and clear the draft) out from under them.
  const blockedFormLabels = useMemo(
    () =>
      retainedSnapshots.map(
        (snapshot) => snapshot.title ?? snapshot.questionnaireId,
      ),
    [retainedSnapshots],
  );

  const { submit, isPending, serverErrors } = useSubmitFillSession({
    forms,
    getStore,
    subject,
    continueDraftId,
    blockedFormLabels,
    onSuccess: () => {
      // Order matters: finishDraft flushes the pristine state before the
      // redirect so useNavigationPrompt doesn't block it.
      autosave.finishDraft();
      navigate(exitTarget);
    },
  });

  // The deliberate server draft (feature-flagged). Same exit as a
  // submission: the server copy supersedes the local autosave one, so
  // finishDraft drops it and flushes the page pristine before we navigate.
  const serverDraftSave = useSaveServerDraft({
    forms,
    getStore,
    subject,
    continueDraftId,
    onSaved: () => {
      autosave.finishDraft();
      navigate(exitTarget);
    },
  });

  const discardServerDraft = useMutation({
    mutationFn: async (draft: FormSubmissionRead) => {
      // Local persistence is off for a resumed server draft. Clear any
      // earlier local copy before discarding the authoritative server copy.
      if (scope && !removeFillDraftCache(scope)) {
        throw new Error("Could not clear the local draft");
      }
      return mutate(formSubmissionApi.update, {
        pathParams: { external_id: draft.id },
      })({ status: "entered_in_error", response_dump: draft.response_dump });
    },
    onSuccess: (discarded) => {
      autosave.finishDraft();
      // Replacing the detail avoids a cancelled refetch restoring the
      // old editable draft when this page unmounts during navigation.
      queryClient.setQueryData(
        formSubmissionKeys.detail(discarded.id),
        discarded,
      );
      queryClient.invalidateQueries({ queryKey: formSubmissionKeys.lists() });
      navigate(exitTarget);
    },
    onError: () => toast.error(t("form_submission_discard_failed")),
  });

  // Both saves capture the current answers and clear the local draft on
  // success. Freeze editing until either request settles so later edits
  // cannot be discarded with a payload that did not contain them.
  const frozen =
    isPending || serverDraftSave.isSavingDraft || discardServerDraft.isPending;

  // A detected local draft stays untouched until Resume or Discard; a
  // successful submit would delete it unreviewed, so Save waits too.
  const restoredDraftPending = !!autosave.restoredDraft;
  const saveChanges = useCallback(() => {
    if (frozen || contextRefreshFailed) return;
    if (restoredDraftPending) {
      toast.error(t("resolve_draft_before_saving"));
      return;
    }
    void submit();
  }, [frozen, contextRefreshFailed, restoredDraftPending, submit, t]);

  useEffect(() => {
    const saveOnShortcut = (event: KeyboardEvent) => {
      if (
        event.key !== "Enter" ||
        !event.shiftKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        event.defaultPrevented ||
        event.repeat ||
        event.isComposing ||
        !scrollHost?.getClientRects().length
      ) {
        return;
      }

      // Pickers and dialogs own their shortcuts. The mounted questionnaire
      // also stays hidden while clinical history is open (checked above).
      const overlayOpen = Array.from(
        document.querySelectorAll<HTMLElement>(
          '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [data-slot="popover-content"]',
        ),
      ).some((element) => element.getClientRects().length > 0);
      if (
        overlayOpen ||
        (event.target instanceof HTMLElement &&
          event.target.closest(
            'select, [role="combobox"][aria-expanded="true"]',
          ))
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      saveChanges();
    };

    // Capture this one combination so it also works while editing a field,
    // without enabling global letter shortcuts in text inputs.
    document.addEventListener("keydown", saveOnShortcut, true);
    return () => document.removeEventListener("keydown", saveOnShortcut, true);
  }, [saveChanges, scrollHost]);

  const closeSession = () => {
    if (frozen) return;
    if (serverDraft) {
      discardServerDraft.mutate(serverDraft);
    } else if (autosave.discardDraft()) {
      navigate(exitTarget);
    }
  };
  const requestClose = () => {
    if (frozen) return;
    if (autosave.dirty || localDraft || serverDraft) {
      setShowCloseConfirmation(true);
    } else {
      closeSession();
    }
  };
  const minimizeSession = () => {
    if (frozen) return;
    if (continueDraftId) {
      if (!contextRefreshFailed) serverDraftSave.saveDraft();
    } else if (autosave.minimizeDraft()) {
      navigate(exitTarget);
    }
  };

  useNavigationPrompt(
    autosave.dirty && !import.meta.env.DEV,
    t("unsaved_changes"),
  );

  // What a federated agent (Scribe) may do to this session, and the one
  // validated path for doing it. Nothing is registered for a session with
  // no patient in scope, so those mounts hand the plugin an empty list.
  const { descriptors, invoke } = useFillActions({
    subject,
    forms,
    getStore,
    frozen,
  });

  const formActions = (
    <div
      className="ml-auto flex flex-wrap items-center justify-end gap-2"
      onKeyDown={(event) => {
        if (
          event.key === "Enter" &&
          !event.shiftKey &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          // Preserve native activation for the form actions.
          event.stopPropagation();
        }
      }}
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="font-semibold underline underline-offset-4"
        onClick={requestClose}
        disabled={frozen}
      >
        {t("cancel")}
      </Button>
      {serverDraftSave.canSaveDraft && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (!contextRefreshFailed) serverDraftSave.saveDraft();
          }}
          disabled={frozen || contextRefreshFailed}
        >
          {serverDraftSave.isSavingDraft && (
            <Loader2 className="size-4 animate-spin" />
          )}
          {t("save_as_draft")}
        </Button>
      )}
      <Button
        type="button"
        size="sm"
        onClick={saveChanges}
        aria-keyshortcuts="Shift+Enter"
        disabled={frozen || contextRefreshFailed}
        className="border border-primary-900/80 bg-linear-to-b from-primary-700 to-primary-800 text-white shadow-sm hover:from-primary-800 hover:to-primary-900"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Check className="size-4" />
        )}
        {t("save_changes")}
        <kbd
          aria-hidden
          className="hidden rounded border border-white/20 px-1 text-[10px] font-normal sm:inline-flex"
        >
          {formatKeyboardShortcut("shift+enter")}
        </kbd>
      </Button>
    </div>
  );

  return (
    <FillSessionTabs
      patientId={patientId}
      facilityId={facilityId}
      dirty={autosave.dirty}
      onClose={requestClose}
      onMinimize={minimizeSession}
      exitDisabled={frozen}
      minimizeDisabled={
        !!continueDraftId &&
        (!serverDraftSave.canSaveDraft || contextRefreshFailed)
      }
    >
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <FillOutlineNavProvider
          scrollContainer={scrollHost}
          stickyHeaderHeight={actionsHeight}
        >
          <div className="relative flex min-h-0 flex-1">
            <FillOutlineOverlay
              onPanelHost={setOutlineHost}
              onRailHost={setRailHost}
            />
            <section
              ref={setScrollHost}
              aria-label={t("form_canvas")}
              className="min-w-0 flex-1 space-y-4 px-4 py-3 md:overflow-y-auto md:px-8 [&_[data-question-id]]:scroll-mt-[calc(var(--fill-shell-header-height)+var(--fill-actions-height)+0.75rem)] md:[&_[data-question-id]]:scroll-mt-[calc(var(--fill-actions-height)+0.75rem)]"
              style={
                {
                  "--fill-actions-height": `${actionsHeight}px`,
                } as CSSProperties
              }
            >
              <FillHeader
                patient={patient}
                encounter={encounter}
                facilityId={facilityId}
                actions={formActions}
                onActionsHeightChange={setActionsHeight}
              />
              <FillSessionNotices
                questionnaireStale={questionnaireStale}
                frozen={frozen}
                resumeLocalDraft={resumeLocalDraft}
                localDraft={localDraft}
                serverDraftDropped={serverDraftDropped}
                restoredDraft={autosave.restoredDraft}
                onResumeDraft={autosave.resumeRestoredDraft}
                onDiscardDraft={autosave.discardRestoredDraft}
                onDismissRestore={autosave.dismissRestoreBar}
                contextRefreshFailed={contextRefreshFailed}
                isRetryingContext={isRetryingContext}
                onRetryContext={onRetryContext}
              />
              <ServerErrorsPanel errors={serverErrors} />
              {forms.map((form) => (
                <FillFormSection
                  key={form.key}
                  form={form}
                  subject={rendererSubject}
                  outlineHost={outlineHost}
                  railHost={railHost}
                  outlineLabel={
                    forms.length > 1 ? form.questionnaire.title : undefined
                  }
                  onStore={handleStore}
                  onRemove={forms.length > 1 ? removeForm : undefined}
                  frozen={frozen}
                />
              ))}
              {/* A resumed SERVER draft is one questionnaire's
                    submission by construction — no adding to it. */}
              {!continueDraftId && (
                <div className="mx-auto flex w-full max-w-3xl justify-center">
                  <QuestionnaireSearch
                    subjectType={pickerSubjectType}
                    facilityId={facilityId}
                    onSelect={addQuestionnaireFromPicker}
                    // The default trigger is a `role="combobox"` button,
                    // and combobox takes no name from its contents — it
                    // would reach screen readers unnamed. This one is a
                    // plain button, so its label IS its name.
                    trigger={
                      <Button
                        type="button"
                        variant="outline"
                        className="border-primary-600 text-primary-800"
                        disabled={frozen}
                      >
                        <Plus className="size-4" />
                        {t("add_questionnaire")}
                      </Button>
                    }
                  />
                </div>
              )}
              {/* Renders nothing unless a plugin provides Scribe. */}
              <PLUGIN_Component
                __name="Scribe"
                actions={descriptors}
                invoke={invoke}
              />
            </section>
          </div>
        </FillOutlineNavProvider>
      </div>
      <div
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.shiftKey &&
            !event.ctrlKey &&
            !event.metaKey &&
            !event.altKey
          ) {
            // Portal events bubble here: keep native dialog button activation.
            event.stopPropagation();
          }
        }}
      >
        <ConfirmActionDialog
          open={showCloseConfirmation}
          onOpenChange={setShowCloseConfirmation}
          title={t("fill_close_discard_draft")}
          description={t("fill_close_discard_description")}
          onConfirm={closeSession}
          confirmText={t("discard")}
          variant="destructive"
          disabled={frozen}
        />
      </div>
    </FillSessionTabs>
  );
}
