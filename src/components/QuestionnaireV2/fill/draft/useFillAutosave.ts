import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

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
  saveFillDraft,
  sessionEditSignature,
} from "./fillDraftStore";

const AUTOSAVE_DEBOUNCE_MS = 1500;

/** The edit signature for ONE form — `sessionEditSignature` scoped to a
 *  single-element input, so the per-form fingerprint is exactly what this
 *  form contributes to the whole-session signature (one rule, never two). */
function formSignature(form: FillFormEntry, store: FormStore): string {
  return sessionEditSignature([
    { questionnaire: form.questionnaire, responses: store.get(responsesAtom) },
  ]);
}

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
  // Flipped by the first save that actually writes a draft. Until then this
  // session has stored nothing, so an empty snapshot of it is not the
  // clinician emptying their work and must not delete a draft an earlier
  // session left under the same key — see `saveFillDraft`'s `mayClear`.
  const storedDraftRef = useRef(false);
  // Read by resumeRestoredDraft, which only ever fires from an event
  // handler well after mount.
  const restoredDraftRef = useRef(restoredDraft);
  restoredDraftRef.current = restoredDraft;
  // A detected draft the clinician has neither resumed nor discarded is
  // still theirs to decide about — see persistNow.
  const restorePendingRef = useRef(false);
  restorePendingRef.current = !!restoredDraft && !restoreDismissed;

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
   * from this session would overwrite it (a structured prefetch, a
   * keystroke).
   */
  const persistNow = useCallback(() => {
    const current = scopeRef.current;
    if (!current || !persistRef.current || finishedRef.current) return;
    if (restorePendingRef.current) return;
    const stored = saveFillDraft(
      current,
      snapshotAll(),
      retainedRef.current,
      storedDraftRef.current,
    );
    if (stored) storedDraftRef.current = true;
  }, [snapshotAll]);

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
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      persistNow();
    };

    // Per-form signature cache, keyed by form.key. A keystroke only ever
    // changes the ONE store that fired, so comparing just that form's own
    // cached entry is sufficient — no other form's signature could have
    // changed, so there is nothing to gain from joining them into a
    // session-wide value.
    //
    // Rebuilt from scratch on every (re)run of this effect — a form
    // add/remove or a store (un)registration bumps `storesVersion`, which
    // is a dependency below — by iterating the CURRENT `forms`/`getStore`.
    // A form no longer in that iteration simply never gets an entry, so a
    // removed form's stale signature can never survive to be compared
    // against again.
    //
    // Whatever is already in the stores when this is built is the
    // baseline, not an edit — this is where the structured widgets'
    // prefetched server rows sit.
    const formSignatures = new Map<string, string>();
    for (const form of forms) {
      const store = getStore(form.key);
      if (!store) continue;
      formSignatures.set(form.key, formSignature(form, store));
    }

    // One shared debounce across every form of the session — the draft is
    // one localStorage entry, so one timer is all it can honour.
    const unsubscribers = forms.flatMap((form) => {
      const store = getStore(form.key);
      if (!store) return [];
      return [
        store.sub(responsesAtom, () => {
          if (finishedRef.current) return;
          // An edit is a change to the draft-safe partition OR to the note
          // on a draft-EXCLUDED question: those answers never reach the
          // stored draft, but abandoning them is still losing the
          // clinician's work, so they must arm the prompt and the chip.
          // What is deliberately NOT an edit is an excluded question's
          // `values`: structured widgets write prefetched server rows there
          // from mount effects, and treating those as edits marked
          // untouched clinical forms dirty and persisted a phantom draft
          // over the clinician's real one.
          //
          // Only THIS form's part is re-serialized — the fired store is
          // the only one that could have changed — and compared against
          // this form's own cached entry.
          const signature = formSignature(form, store);
          if (formSignatures.get(form.key) === signature) return;
          formSignatures.set(form.key, signature);
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
    // the gate synchronously (the ref recomputes only on the next render)
    // and write now, so anything typed in the meantime becomes a fresh
    // draft of its own instead of living un-persisted until the next
    // keystroke. An untouched session stores nothing, and the key it would
    // otherwise clear is already gone.
    restorePendingRef.current = false;
    setRestoreDismissed(true);
    persistNow();
  }, [persistNow]);

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
