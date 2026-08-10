import { History, Plus, X } from "lucide-react";
import { navigate, useNavigationPrompt } from "raviger";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { QuestionnaireSearch } from "@/components/Questionnaire/QuestionnaireSearch";

import type { EncounterRead } from "@/types/emr/encounter/encounter";
import type { PatientRead } from "@/types/emr/patient/patient";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type {
  QuestionnaireRead,
  SubjectType,
} from "@/types/questionnaire/questionnaire";

import { ClinicalHistoryTab } from "./ClinicalHistoryTab";
import { DraftRestoreBar } from "./DraftRestoreBar";
import { DroppedAnswersList } from "./DroppedAnswersList";
import { FillFormSection } from "./FillFormSection";
import { FillHeader } from "./FillHeader";
import {
  FillOutlineNavProvider,
  FillOutlineOverlay,
} from "./FillOutlineOverlay";
import { FillShell } from "./FillShell";
import { ServerErrorsPanel } from "./ServerErrorsPanel";
import type { FormStore } from "./StoreRegistrar";
import type { DroppedDraftAnswer } from "./draft/draftMerge";
import type { FillDraftScope, LoadedFillDraft } from "./draft/fillDraftStore";
import { useFillSessionAutosave } from "./draft/useFillAutosave";
import { useSaveServerDraft } from "./draft/useSaveServerDraft";
import type { FillSubject } from "./subject";
import { rendererSubjectOf } from "./subject";
import { useSubmitFillSession } from "./submit/useSubmitFillSession";
import { useFillSessionForms } from "./useFillSessionForms";

/** The canvas title and its unsaved-work badge. One fragment shared by the
 *  two header branches (tab strip where a patient gives us a clinical
 *  history tab, plain label otherwise) so the chip can never drift out of
 *  one of them. */
function QuestionnaireTitleWithDraftBadge({ dirty }: { dirty: boolean }) {
  const { t } = useTranslation();
  return (
    <>
      {t("questionnaire_one")}
      {dirty && (
        <Badge className="ml-2 bg-indigo-100 text-indigo-900">
          {t("draft")}
        </Badge>
      )}
    </>
  );
}

/**
 * "Questionnaire was updated — reload" notice. `onReload` is a hard page
 * reload, deliberately NOT an in-place swap of the mounted session's
 * `questionnaire` reference — a hot-swap would race `FormContext.tsx`'s
 * live-sync effect over the same `responsesAtom` (see the
 * `questionnaireStale` comment in `FillPageBody`). A full reload flushes
 * to the local draft first (the same `pagehide` handler autosave already
 * installs) and lets the ordinary mount flow's `loadFillDraft` merge take
 * it from there.
 */
function QuestionnaireUpdatedBanner({
  onReload,
  onDismiss,
  frozen,
}: {
  onReload: () => void;
  onDismiss: () => void;
  frozen: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
      <div className="min-w-0 flex-1">
        <p>{t("fill_questionnaire_updated_banner")}</p>
      </div>
      <Button type="button" size="sm" onClick={onReload} disabled={frozen}>
        {t("fill_questionnaire_reload")}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t("close")}
        onClick={onDismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

/**
 * What a RESUMED SERVER draft lost to questionnaire changes. The local-draft
 * equivalent lives in the restore bar, which can name the drops before the
 * clinician accepts; a server draft is seeded at creation with no such gate,
 * so the same facts arrive as a dismissible notice instead of silence.
 */
function ServerDraftDropNotice({
  dropped,
  onDismiss,
}: {
  dropped: DroppedDraftAnswer[];
  onDismiss: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto mb-4 flex w-full max-w-3xl items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <History aria-hidden className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 flex-1">
        <DroppedAnswersList dropped={dropped} />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="size-8"
        aria-label={t("close")}
        onClick={onDismiss}
      >
        <X className="size-4" />
      </Button>
    </div>
  );
}

interface FillPageBodyProps {
  questionnaire: QuestionnaireRead;
  patient?: PatientRead;
  encounter?: EncounterRead;
  subject: FillSubject;
  pickerSubjectType: SubjectType;
  scope: FillDraftScope | undefined;
  localDraft: LoadedFillDraft | undefined;
  /** Resumed server draft, seeded into the primary form at creation. */
  serverDraftResponses?: Record<string, QuestionnaireResponse>;
  /** Answers that resumed draft could not carry onto the current
   *  questionnaire — surfaced, never dropped silently. */
  serverDraftDropped?: DroppedDraftAnswer[];
  continueDraftId?: string;
  exitTarget: string;
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
  serverDraftResponses,
  serverDraftDropped,
  continueDraftId,
  exitTarget,
}: FillPageBodyProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"questionnaire" | "history">("questionnaire");
  // History mounts on first activation and stays mounted after (hidden) —
  // eager mounting would fire its queries and leak its text into the DOM
  // for sessions that never open it, while unmount-on-switch would blank
  // adapted structured widgets that keep local state.
  const [historyMounted, setHistoryMounted] = useState(false);
  const [dropNoticeDismissed, setDropNoticeDismissed] = useState(false);

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
  const [reloadBannerDismissed, setReloadBannerDismissed] = useState(false);
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

  const { submit, isPending, isComposing, serverErrors } = useSubmitFillSession(
    {
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
    },
  );

  // The fill session stays fully editable during an in-flight submit
  // unless every input-bearing surface reads this. "composing" covers the
  // click-to-mutate gap (client validation + batch compose) and
  // "submitting" the request itself; either one means an edit typed right
  // now would diverge from the payload already built/sent. `isPending` is
  // the hook's own OR of the two (see useSubmitFillSession.ts). Releases
  // the moment the mutation settles (success navigates away; an error
  // flips isPending back to false), so a failed submit leaves the form
  // editable again for a retry.
  const sessionPhase: "editing" | "composing" | "submitting" = isComposing
    ? "composing"
    : isPending
      ? "submitting"
      : "editing";
  const frozen = sessionPhase !== "editing";

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

  useNavigationPrompt(
    autosave.dirty && !import.meta.env.DEV,
    t("unsaved_changes"),
  );

  return (
    // Tabs wraps the shell so its Radix context reaches both the strip in
    // FillShell's `tabs` slot and the TabsContent panels below.
    <Tabs
      value={tab}
      onValueChange={(value) => {
        if (value === "history") setHistoryMounted(true);
        setTab(value as typeof tab);
      }}
    >
      <FillShell
        onClose={() => navigate(exitTarget)}
        tabs={
          // The clinical history tab exists only where there IS a patient
          // — a location/device/facility fill gets the plain title in the
          // same slot, draft badge included.
          patientId ? (
            <TabsList>
              <TabsTrigger value="questionnaire">
                <QuestionnaireTitleWithDraftBadge dirty={autosave.dirty} />
              </TabsTrigger>
              <TabsTrigger value="history">
                {t("patient_clinical_history")}
              </TabsTrigger>
            </TabsList>
          ) : (
            <div className="flex items-center py-1.5 text-sm font-medium text-gray-900">
              <QuestionnaireTitleWithDraftBadge dirty={autosave.dirty} />
            </div>
          )
        }
      >
        {/* The form panel stays mounted across switches (forceMount +
            hidden): some adapted structured widgets keep local state they
            never rehydrate from the response — an unmount would blank
            them. */}
        <TabsContent
          value="questionnaire"
          forceMount
          className="mt-3 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
        >
          <div className="mx-2 flex min-h-0 flex-1 flex-col rounded-t-xl border border-gray-200 bg-white md:mx-4">
            <FillHeader
              patient={patient}
              encounter={encounter}
              facilityId={facilityId}
              onCancel={() => navigate(exitTarget)}
              onSubmit={() => void submit()}
              isSubmitting={isPending}
              onSaveDraft={
                serverDraftSave.canSaveDraft
                  ? serverDraftSave.saveDraft
                  : undefined
              }
              isSavingDraft={serverDraftSave.isSavingDraft}
            />
            <FillOutlineNavProvider scrollContainer={scrollHost}>
              <div className="relative flex min-h-0 flex-1">
                <FillOutlineOverlay
                  onPanelHost={setOutlineHost}
                  onRailHost={setRailHost}
                />
                <section
                  ref={setScrollHost}
                  aria-label={t("form_canvas")}
                  className="min-w-0 flex-1 space-y-6 overflow-y-auto px-4 py-5 md:px-8"
                >
                  {questionnaireStale && !reloadBannerDismissed && (
                    <QuestionnaireUpdatedBanner
                      onReload={() => window.location.reload()}
                      onDismiss={() => setReloadBannerDismissed(true)}
                      frozen={frozen}
                    />
                  )}
                  {serverDraftDropped &&
                    serverDraftDropped.length > 0 &&
                    !dropNoticeDismissed && (
                      <ServerDraftDropNotice
                        dropped={serverDraftDropped}
                        onDismiss={() => setDropNoticeDismissed(true)}
                      />
                    )}
                  {autosave.restoredDraft && (
                    <DraftRestoreBar
                      draft={autosave.restoredDraft}
                      onResume={autosave.resumeRestoredDraft}
                      onDiscard={autosave.discardRestoredDraft}
                      onDismiss={autosave.dismissRestoreBar}
                      frozen={frozen}
                    />
                  )}
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
                </section>
              </div>
            </FillOutlineNavProvider>
          </div>
        </TabsContent>

        {patientId && (
          <TabsContent
            value="history"
            forceMount={historyMounted || undefined}
            className="mt-3 min-h-0 flex-1 overflow-y-auto px-4 pb-6 data-[state=inactive]:hidden md:px-6"
          >
            {historyMounted && (
              <ClinicalHistoryTab
                patientId={patientId}
                facilityId={facilityId}
              />
            )}
          </TabsContent>
        )}
      </FillShell>
    </Tabs>
  );
}
