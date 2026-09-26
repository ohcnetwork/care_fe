import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";

import { fillDraftScopeKey } from "./fillDraftCore";
import type {
  DraftFormSnapshot,
  FillDraftScope,
  FillSessionFormState,
  LoadedFillDraft,
} from "./fillDraftStore";
import {
  clearFillDraft,
  mergeDraftIntoSeed,
  preserveExcludedStructured,
  saveFillDraft,
} from "./fillDraftStore";
import { subscribeToFillEdits } from "./subscribeToFillEdits";

interface UseFillSessionAutosaveArgs {
  /** This session's draft key — undefined only before the questionnaire
   *  loads. Supplied even in modes that never WRITE a local draft: a
   *  successful submit must still clear a sibling draft stored under the
   *  same key by an earlier plain session. */
  scope: FillDraftScope | undefined;
  /** false while resuming a SERVER draft: the server copy is authoritative
   *  there, so nothing persists locally. Dirty tracking stays on either
   *  way — the unsaved-changes prompt and the Draft chip are about the
   *  clinician's un-submitted edits, not about where the bytes live. */
  persistLocally?: boolean;
  /** Every questionnaire in the session, primary first. */
  forms: FillFormEntry[];
  getStore: (key: string) => FormStore | undefined;
  /** Bumped by the host whenever a StoreRegistrar (un)registers. */
  storesVersion: number;
  /** The draft this page instance detected, if any. */
  restoredDraft: LoadedFillDraft | undefined;
  /** The encounter's draft action already requested restoration. */
  resumeAutomatically?: boolean;
  /** Snapshots the host could not turn back into live forms (a resume
   *  whose re-fetch failed). They stay in the persisted draft so a
   *  transient error cannot destroy their answers. */
  retainedSnapshots?: DraftFormSnapshot[];
  /** Resume path for forms beyond the primary: the host re-adds them
   *  (fetch by id, version-check, seed via initialResponses). */
  onResumeAddedForms: (snapshots: DraftFormSnapshot[]) => void;
}

/**
 * Local autosave for a fill session. It subscribes to each registered form
 * store behind one debounce, flushes on pagehide/unmount, and exposes the
 * dirty and restore-prompt state rendered by the page chrome.
 */
export function useFillSessionAutosave({
  scope,
  persistLocally = true,
  forms,
  getStore,
  storesVersion,
  restoredDraft,
  resumeAutomatically = false,
  retainedSnapshots,
  onResumeAddedForms,
}: UseFillSessionAutosaveArgs) {
  const { t } = useTranslation();
  const [dirty, setDirty] = useState(false);
  const [restoreDismissed, setRestoreDismissed] = useState(false);
  const restoredAppliedRef = useRef(false);
  // StoreRegistrar unregisters in a child effect cleanup. Keep the store
  // available until this hook's cleanup has flushed the final keystroke.
  const registeredStores = useRef(new Map<string, FormStore>());

  // The subscription effect reads these without re-subscribing.
  const scopeRef = useRef(scope);
  const persistRef = useRef(persistLocally);
  const retainedRef = useRef(retainedSnapshots);
  // Set on successful submit: the draft served its purpose, so neither the
  // pending debounce nor the unmount/pagehide flush may re-save it.
  const finishedRef = useRef(false);
  // Flipped by the first save that actually writes a draft. Until then this
  // session has stored nothing, so an empty snapshot of it is not the
  // clinician emptying their work and must not delete a draft an earlier
  // session left under the same key — see `saveFillDraft`'s `mayClear`.
  const storedDraftRef = useRef(false);
  const persistenceFailedRef = useRef(false);
  // Read by resumeRestoredDraft, which only ever fires from an event
  // handler well after mount.
  const restoredDraftRef = useRef(restoredDraft);
  // A detected draft the clinician has neither resumed nor discarded is
  // still theirs to decide about — see persistNow.
  const restorePendingRef = useRef(false);
  // Publish only committed values. A suspended/abandoned render must not
  // change what existing subscriptions or an unmount flush persist.
  useLayoutEffect(() => {
    scopeRef.current = scope;
    persistRef.current = persistLocally;
    retainedRef.current = retainedSnapshots;
    restoredDraftRef.current = restoredDraft;
    restorePendingRef.current = !!restoredDraft && !restoreDismissed;
  }, [
    scope,
    persistLocally,
    retainedSnapshots,
    restoredDraft,
    restoreDismissed,
  ]);

  const scopeKey = scope ? fillDraftScopeKey(scope) : undefined;

  /** Include each form, using its creation seed until its store registers. */
  const snapshotAll = useCallback((): FillSessionFormState[] => {
    const snapshots: FillSessionFormState[] = [];
    for (const form of forms) {
      const store =
        getStore(form.key) ?? registeredStores.current.get(form.key);
      if (store) registeredStores.current.set(form.key, store);
      snapshots.push({
        questionnaire: form.questionnaire,
        responses:
          store?.get(responsesAtom) ??
          form.initialResponses ??
          initializeResponses(form.questionnaire.questions),
      });
    }
    return snapshots;
  }, [forms, getStore]);

  /**
   * Write the whole session to its one draft entry. Never runs after a
   * successful submit, and never while `persistLocally` is off.
   *
   * While the restore prompt is still un-acted NOTHING persists: the
   * stored draft is the clinician's to accept or discard, and any write
   * from this session would overwrite it (a structured prefetch, a
   * keystroke).
   */
  const persistNow = useCallback(() => {
    const current = scopeRef.current;
    if (!current || !persistRef.current || finishedRef.current) return;
    if (restorePendingRef.current) return;
    const result = saveFillDraft(
      current,
      snapshotAll(),
      retainedRef.current,
      storedDraftRef.current,
    );
    if (result === "saved") storedDraftRef.current = true;
    if (result === "failed" && !persistenceFailedRef.current) {
      toast.error(t("questionnaire_draft_save_failed"));
    }
    // Warn once per failure episode. Keep tracking edits and retrying so
    // a later successful write can restore reload protection.
    persistenceFailedRef.current = result === "failed";
  }, [snapshotAll, t]);

  /**
   * The session SHAPE changed (a form was added or removed) or a store
   * (un)registered — persist now. The debounce cannot cover this: on an
   * update React runs the previous effect's cleanup BEFORE the new
   * sections' StoreRegistrars register, so that flush would write a
   * snapshot missing the just-added forms and silently shrink the stored
   * draft (the Resume path re-adds drafted forms exactly this way).
   * Gated on `dirty`, because an untouched session has nothing of the
   * clinician's to write.
   */
  useEffect(() => {
    if (!scopeKey || !persistLocally || !dirty) return;
    persistNow();
  }, [
    scopeKey,
    persistLocally,
    dirty,
    storesVersion,
    retainedSnapshots,
    persistNow,
  ]);

  // Not gated on `scopeKey`/`persistLocally`: dirty tracking is what arms
  // the unsaved-changes prompt and the Draft chip, and a session resuming
  // a SERVER draft needs both even though it writes no local draft.
  // `persistNow` is the thing that stands down, not the subscription.
  useEffect(() => {
    const observedForms = forms.flatMap((form) => {
      const store = getStore(form.key);
      if (!store) return [];
      registeredStores.current.set(form.key, store);
      return [{ questionnaire: form.questionnaire, store }];
    });
    const edits = subscribeToFillEdits(observedForms, {
      isFinished: () => finishedRef.current,
      onEdit: () => setDirty(true),
      persist: persistNow,
    });

    // pagehide covers reload/close/bfcache; unmount covers in-app nav.
    window.addEventListener("pagehide", edits.flush);
    return () => {
      window.removeEventListener("pagehide", edits.flush);
      edits.dispose();
    };
    // storesVersion re-runs the subscription when a form (un)registers.
  }, [storesVersion, forms, getStore, persistNow]);

  /** Successful submit: drop the stored draft, stop all further saves,
   *  and clear the dirty flag SYNCHRONOUSLY (flushSync) — the success
   *  handler navigates right after this, and `useNavigationPrompt` must
   *  already see a pristine page or it blocks the redirect.
   *
   *  The clear runs off `scope`, not off whether this session PERSISTED
   *  locally: a server-draft session shares its key with the plain mount,
   *  and a local draft left behind there would prompt Resume with answers
   *  this submit already filed. */
  const finishDraft = useCallback(() => {
    finishedRef.current = true;
    const current = scopeRef.current;
    if (current) clearFillDraft(current);
    flushSync(() => {
      setDirty(false);
      setRestoreDismissed(true);
    });
  }, []);

  const discardRestoredDraft = useCallback(() => {
    const current = scopeRef.current;
    if (current) clearFillDraft(current);
    // Discard drops the STORED draft — never what is on screen. The draft
    // only ever reaches the stores through Resume, so while the bar shows
    // they hold nothing but this session's own work: prefetched clinical
    // rows and whatever the clinician typed while ignoring the prompt.
    // Resetting them would destroy exactly the un-persisted work the
    // prompt gate protects.
    //
    // Persistence was standing down while the prompt was pending — flip
    // the gate synchronously (the ref updates only after the next commit)
    // and write now, so anything typed in the meantime becomes a fresh
    // draft of its own instead of living un-persisted until the next
    // keystroke. An untouched session stores nothing, and the key it would
    // otherwise clear is already gone.
    restorePendingRef.current = false;
    setRestoreDismissed(true);
    persistNow();
  }, [persistNow]);

  const dismissRestoreBar = useCallback(() => {
    restorePendingRef.current = false;
    setRestoreDismissed(true);
    persistNow();
  }, [persistNow]);

  /** Apply the restored draft — from the overview or restore prompt. The
   *  primary form's snapshot lands in the live store through the shared
   *  overlay rule; every other snapshot goes back to the host, which
   *  re-adds those questionnaires seeded from their snapshots. */
  const resumeRestoredDraft = useCallback(() => {
    const draft = restoredDraftRef.current;
    if (!draft || restoredAppliedRef.current) return;
    const primary = forms.find((form) => form.isPrimary);
    const store = primary && getStore(primary.key);
    // Automatic restoration can run during mount. Wait for registration
    // instead of dismissing the draft before its answers reach the form.
    if (!primary || !store) return;
    restoredAppliedRef.current = true;
    const addedSnapshots: DraftFormSnapshot[] = [];
    for (const snapshot of draft.forms) {
      if (snapshot.questionnaireId === primary.key) {
        store.set(
          responsesAtom,
          preserveExcludedStructured(
            store.get(responsesAtom),
            mergeDraftIntoSeed(
              primary.questionnaire.questions,
              snapshot.responses,
            ),
          ),
        );
        continue;
      }
      addedSnapshots.push(snapshot);
    }
    if (addedSnapshots.length > 0) onResumeAddedForms(addedSnapshots);
    setDirty(true);
    setRestoreDismissed(true);
  }, [forms, getStore, onResumeAddedForms]);

  useEffect(() => {
    if (resumeAutomatically) resumeRestoredDraft();
  }, [resumeAutomatically, storesVersion, resumeRestoredDraft]);

  return {
    /** Any edit since mount — drives the Draft chip. A merely-detected
     *  draft is NOT dirty; the chip lights only after Resume or an edit. */
    dirty,
    restoredDraft: restoreDismissed ? undefined : restoredDraft,
    discardRestoredDraft,
    dismissRestoreBar,
    resumeRestoredDraft,
    /** For the submit-success path: the draft served its purpose. */
    finishDraft,
  };
}
