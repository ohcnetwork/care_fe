import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";

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
  safeSessionSignature,
  saveFillDraft,
} from "./fillDraftStore";

const AUTOSAVE_DEBOUNCE_MS = 1500;

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
  /** Snapshots the host could not turn back into live forms (a resume
   *  whose re-fetch failed). They stay in the persisted draft so a
   *  transient error cannot destroy their answers. */
  retainedSnapshots?: DraftFormSnapshot[];
  /** Resume path for forms beyond the primary: the host re-adds them
   *  (fetch by id, version-check, seed via initialResponses). */
  onResumeAddedForms: (snapshots: DraftFormSnapshot[]) => void;
}

/**
 * The local autosave engine for a whole fill session. Lives OUTSIDE the
 * form providers: it reaches each form's instance store through the
 * host's registry, subscribes to all of them behind one shared debounce,
 * flushes on pagehide/unmount so quick closes keep the last keystrokes,
 * and exposes the state the chrome renders (Draft chip, restore bar).
 *
 * `discardRestoredDraft` clears the stored draft AND resets the forms that
 * draft covered back to a pristine seed — the restore bar's one
 * destructive affordance, deliberately scoped so it cannot reach a form
 * the clinician added after the prompt appeared.
 */
export function useFillSessionAutosave({
  scope,
  persistLocally = true,
  forms,
  getStore,
  storesVersion,
  restoredDraft,
  retainedSnapshots,
  onResumeAddedForms,
}: UseFillSessionAutosaveArgs) {
  const [dirty, setDirty] = useState(false);
  const [restoreDismissed, setRestoreDismissed] = useState(false);

  // The subscription effect reads these without re-subscribing.
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  const persistRef = useRef(persistLocally);
  persistRef.current = persistLocally;
  const retainedRef = useRef(retainedSnapshots);
  retainedRef.current = retainedSnapshots;
  // Set on successful submit: the draft served its purpose, so neither the
  // pending debounce nor the unmount/pagehide flush may re-save it.
  const finishedRef = useRef(false);
  // Read by resumeRestoredDraft, which only ever fires from an event
  // handler well after mount.
  const restoredDraftRef = useRef(restoredDraft);
  restoredDraftRef.current = restoredDraft;
  // A detected draft the clinician has neither resumed nor discarded is
  // still theirs to decide about — see persistNow.
  const restorePendingRef = useRef(false);
  restorePendingRef.current = !!restoredDraft && !restoreDismissed;
  /** Fingerprint of the draft-safe state the last settled write saw — the
   *  baseline the edit detector compares against. */
  const safeSignatureRef = useRef<string | undefined>(undefined);

  const scopeKey = scope
    ? `${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`
    : undefined;

  /** One snapshot per REGISTERED form — a form whose section hasn't
   *  mounted yet simply doesn't contribute. */
  const snapshotAll = useCallback((): FillSessionFormState[] => {
    const snapshots: FillSessionFormState[] = [];
    for (const form of forms) {
      const store = getStore(form.key);
      if (!store) continue;
      snapshots.push({
        questionnaire: form.questionnaire,
        responses: store.get(responsesAtom),
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
   * from this session would either overwrite it (a structured prefetch, a
   * keystroke) or — via `saveFillDraft`'s clear-on-empty branch — delete
   * it outright.
   */
  const persistNow = useCallback(() => {
    const current = scopeRef.current;
    if (!current || !persistRef.current || finishedRef.current) return;
    if (restorePendingRef.current) return;
    saveFillDraft(current, snapshotAll(), retainedRef.current);
  }, [snapshotAll]);

  /**
   * The session SHAPE changed (a form was added or removed) or a store
   * (un)registered — persist now. The debounce cannot cover this: on an
   * update React runs the previous effect's cleanup BEFORE the new
   * sections' StoreRegistrars register, so that flush would write a
   * snapshot missing the just-added forms and silently shrink the stored
   * draft (the Resume path re-adds drafted forms exactly this way).
   * Gated on `dirty`, because an untouched session is empty and an empty
   * save takes `saveFillDraft`'s clear-on-empty branch.
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
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      persistNow();
    };

    // Whatever is already in the stores is the baseline, not an edit —
    // this is where the structured widgets' prefetched server rows sit.
    safeSignatureRef.current = safeSessionSignature(snapshotAll());

    // One shared debounce across every form of the session — the draft is
    // one localStorage entry, so one timer is all it can honour.
    const unsubscribers = forms.flatMap((form) => {
      const store = getStore(form.key);
      if (!store) return [];
      return [
        store.sub(responsesAtom, () => {
          if (finishedRef.current) return;
          // An edit is a change to the DRAFT-SAFE partition. Structured
          // types with draftPolicy "exclude" write prefetched server rows
          // into the store from mount effects; treating those writes as
          // edits marked untouched clinical forms dirty and persisted a
          // phantom draft over the clinician's real one.
          const signature = safeSessionSignature(snapshotAll());
          if (signature === safeSignatureRef.current) return;
          safeSignatureRef.current = signature;
          setDirty(true);
          clearTimeout(timer);
          timer = setTimeout(() => {
            timer = undefined;
            persistNow();
          }, AUTOSAVE_DEBOUNCE_MS);
        }),
      ];
    });

    // pagehide covers reload/close/bfcache; unmount covers in-app nav.
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      for (const unsubscribe of unsubscribers) unsubscribe();
    };
    // storesVersion re-runs the subscription when a form (un)registers.
  }, [storesVersion, forms, getStore, persistNow, snapshotAll]);

  /** Successful submit: drop the stored draft, stop all further saves,
   *  and clear the dirty flag SYNCHRONOUSLY (flushSync) — the success
   *  handler navigates right after this, and `useNavigationPrompt` must
   *  already see a pristine page or it blocks the redirect (the same
   *  reason the legacy form flushSync'd `setIsDirty(false)`).
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
    // Only the forms the DISCARDED DRAFT covered go back to a pristine
    // seed. "Add questionnaire" is not gated on the prompt, so a
    // clinician can add a form and type real answers into it while the
    // stale-draft banner is still up — resetting that form too would
    // silently destroy work they just did, on a button that promises only
    // to drop an old draft.
    const covered = new Set(
      restoredDraftRef.current?.forms.map(
        (snapshot) => snapshot.questionnaireId,
      ) ?? [],
    );
    for (const form of forms) {
      if (!covered.has(form.key)) continue;
      const store = getStore(form.key);
      if (!store) continue;
      store.set(
        responsesAtom,
        preserveExcludedStructured(
          store.get(responsesAtom),
          initializeResponses(form.questionnaire.questions),
        ),
      );
    }
    setDirty(false);
    setRestoreDismissed(true);
  }, [forms, getStore]);

  const dismissRestoreBar = useCallback(() => setRestoreDismissed(true), []);

  /** Apply the restored draft — the prompt bar's Resume affordance. The
   *  primary form's snapshot lands in the live store through the shared
   *  overlay rule; every other snapshot goes back to the host, which
   *  re-adds those questionnaires seeded from their snapshots. */
  const resumeRestoredDraft = useCallback(() => {
    const draft = restoredDraftRef.current;
    if (!draft) return;
    const primary = forms.find((form) => form.isPrimary);
    const addedSnapshots: DraftFormSnapshot[] = [];
    for (const snapshot of draft.forms) {
      if (primary && snapshot.questionnaireId === primary.key) {
        const store = getStore(primary.key);
        if (store) {
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
        }
        continue;
      }
      addedSnapshots.push(snapshot);
    }
    if (addedSnapshots.length > 0) onResumeAddedForms(addedSnapshots);
    setDirty(true);
    setRestoreDismissed(true);
  }, [forms, getStore, onResumeAddedForms]);

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
