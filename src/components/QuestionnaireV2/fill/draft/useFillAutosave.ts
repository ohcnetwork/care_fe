import { useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  initializeResponses,
  responsesAtom,
} from "@/components/QuestionnaireV2/renderer/store";

import { useFormRenderer } from "@/components/QuestionnaireV2/form/FormContext";

import type { FillDraftScope, LoadedFillDraft } from "./fillDraftStore";
import { clearFillDraft, saveFillDraft } from "./fillDraftStore";

const AUTOSAVE_DEBOUNCE_MS = 1500;

interface UseFillAutosaveArgs {
  /** undefined disables autosave (no signed-in user / loading). */
  scope: FillDraftScope | undefined;
  /** The draft this page instance was seeded from, if any. */
  restoredDraft: LoadedFillDraft | undefined;
}

/**
 * The local autosave engine. Runs inside `QuestionnaireFormProvider`:
 * subscribes to the instance store, debounces writes, flushes on
 * pagehide/unmount so quick closes keep the last keystrokes, and exposes
 * the state the chrome renders (Draft chip, restore bar).
 *
 * `discardRestoredDraft` clears the stored draft AND resets the working
 * state to a pristine seed — the restore bar's one destructive
 * affordance.
 */
export function useFillAutosave({ scope, restoredDraft }: UseFillAutosaveArgs) {
  const store = useStore();
  const { questionnaire } = useFormRenderer();
  const [dirty, setDirty] = useState(false);
  const [restoreDismissed, setRestoreDismissed] = useState(false);

  // The subscription effect reads these without re-subscribing.
  const scopeRef = useRef(scope);
  scopeRef.current = scope;

  const scopeKey = scope
    ? `${scope.userId}--${scope.subjectKey}--${scope.questionnaireId}--${scope.questionnaireVersion}`
    : undefined;

  useEffect(() => {
    if (!scopeKey) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const flush = () => {
      if (timer === undefined) return;
      clearTimeout(timer);
      timer = undefined;
      const current = scopeRef.current;
      if (current) saveFillDraft(current, store.get(responsesAtom));
    };

    const unsubscribe = store.sub(responsesAtom, () => {
      setDirty(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        const current = scopeRef.current;
        if (current) saveFillDraft(current, store.get(responsesAtom));
      }, AUTOSAVE_DEBOUNCE_MS);
    });

    // pagehide covers reload/close/bfcache; unmount covers in-app nav.
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
      unsubscribe();
    };
  }, [store, scopeKey]);

  const clearDraft = useCallback(() => {
    const current = scopeRef.current;
    if (current) clearFillDraft(current);
  }, []);

  const discardRestoredDraft = useCallback(() => {
    const current = scopeRef.current;
    if (current) clearFillDraft(current);
    store.set(responsesAtom, initializeResponses(questionnaire.questions));
    setDirty(false);
    setRestoreDismissed(true);
  }, [store, questionnaire]);

  const dismissRestoreBar = useCallback(() => setRestoreDismissed(true), []);

  return {
    /** Any edit since mount (or a restored draft) — drives the Draft chip. */
    dirty: dirty || (!!restoredDraft && !restoreDismissed),
    restoredDraft: restoreDismissed ? undefined : restoredDraft,
    discardRestoredDraft,
    dismissRestoreBar,
    /** For the submit-success path: the draft served its purpose. */
    clearDraft,
  };
}
