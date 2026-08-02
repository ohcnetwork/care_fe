import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/renderer/store";

import type { FillFormEntry } from "@/components/QuestionnaireV2/fill/formSession";
import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type {
  DraftFormSnapshot,
  FillDraftScope,
  LoadedFillDraft,
} from "./fillDraftStore";
import {
  clearFillDraft,
  mergeDraftIntoSeed,
  saveFillDraft,
} from "./fillDraftStore";

const AUTOSAVE_DEBOUNCE_MS = 1500;

interface UseFillSessionAutosaveArgs {
  /** undefined disables autosave (no scope / resuming a server draft). */
  scope: FillDraftScope | undefined;
  /** Every questionnaire in the session, primary first. */
  forms: FillFormEntry[];
  getStore: (key: string) => FormStore | undefined;
  /** Bumped by the host whenever a StoreRegistrar (un)registers. */
  storesVersion: number;
  /** The draft this page instance detected, if any. */
  restoredDraft: LoadedFillDraft | undefined;
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
 * `discardRestoredDraft` clears the stored draft AND resets every form's
 * working state to a pristine seed — the restore bar's one destructive
 * affordance.
 */
export function useFillSessionAutosave({
  scope,
  forms,
  getStore,
  storesVersion,
  restoredDraft,
  onResumeAddedForms,
}: UseFillSessionAutosaveArgs) {
  const [dirty, setDirty] = useState(false);
  const [restoreDismissed, setRestoreDismissed] = useState(false);

  // The subscription effect reads these without re-subscribing.
  const scopeRef = useRef(scope);
  scopeRef.current = scope;
  // Set on successful submit: the draft served its purpose, so neither the
  // pending debounce nor the unmount/pagehide flush may re-save it.
  const finishedRef = useRef(false);
  // Read by resumeRestoredDraft, which only ever fires from an event
  // handler well after mount.
  const restoredDraftRef = useRef(restoredDraft);
  restoredDraftRef.current = restoredDraft;

  const scopeKey = scope
    ? `${scope.userId}--${scope.subjectKey}--${scope.entryQuestionnaireId}`
    : undefined;

  /** One snapshot per REGISTERED form — a form whose section hasn't
   *  mounted yet simply doesn't contribute. */
  const snapshotAll = useCallback((): Array<{
    questionnaire: QuestionnaireRead;
    responses: Record<string, QuestionnaireResponse>;
  }> => {
    const snapshots = [];
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

  useEffect(() => {
    if (!scopeKey) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const save = () => {
      const current = scopeRef.current;
      if (current && !finishedRef.current) {
        saveFillDraft(current, snapshotAll());
      }
    };

    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      save();
    };

    // One shared debounce across every form of the session — the draft is
    // one localStorage entry, so one timer is all it can honour.
    const unsubscribers = forms.flatMap((form) => {
      const store = getStore(form.key);
      if (!store) return [];
      return [
        store.sub(responsesAtom, () => {
          if (finishedRef.current) return;
          setDirty(true);
          clearTimeout(timer);
          timer = setTimeout(() => {
            timer = undefined;
            save();
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
  }, [scopeKey, storesVersion, forms, getStore, snapshotAll]);

  /** Successful submit: drop the stored draft, stop all further saves,
   *  and clear the dirty flag SYNCHRONOUSLY (flushSync) — the success
   *  handler navigates right after this, and `useNavigationPrompt` must
   *  already see a pristine page or it blocks the redirect (the same
   *  reason the legacy form flushSync'd `setIsDirty(false)`). */
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
    for (const form of forms) {
      getStore(form.key)?.set(
        responsesAtom,
        initializeResponses(form.questionnaire.questions),
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
        getStore(primary.key)?.set(
          responsesAtom,
          mergeDraftIntoSeed(
            primary.questionnaire.questions,
            snapshot.responses,
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
