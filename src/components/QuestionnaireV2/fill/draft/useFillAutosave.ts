import { useStore } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

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
  // Set on successful submit: the draft served its purpose, so neither the
  // pending debounce nor the unmount/pagehide flush may re-save it.
  const finishedRef = useRef(false);
  // Read by resumeRestoredDraft, which only ever fires from an event
  // handler well after mount.
  const restoredDraftRef = useRef(restoredDraft);
  restoredDraftRef.current = restoredDraft;

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
      if (current && !finishedRef.current) {
        saveFillDraft(current, store.get(responsesAtom));
      }
    };

    const unsubscribe = store.sub(responsesAtom, () => {
      if (finishedRef.current) return;
      setDirty(true);
      clearTimeout(timer);
      timer = setTimeout(() => {
        timer = undefined;
        const current = scopeRef.current;
        if (current && !finishedRef.current) {
          saveFillDraft(current, store.get(responsesAtom));
        }
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
    store.set(responsesAtom, initializeResponses(questionnaire.questions));
    setDirty(false);
    setRestoreDismissed(true);
  }, [store, questionnaire]);

  const dismissRestoreBar = useCallback(() => setRestoreDismissed(true), []);

  /** Apply the restored draft into the live store — the prompt bar's
   *  Resume affordance. Overlay is gated on the question still existing
   *  with the same structured_type (same rule as the provider's
   *  creation-time initialResponses merge). */
  const resumeRestoredDraft = useCallback(() => {
    const draft = restoredDraftRef.current;
    if (!draft) return;
    const seeded = initializeResponses(questionnaire.questions);
    for (const [id, response] of Object.entries(draft.responses)) {
      const fresh = seeded[id];
      if (fresh && fresh.structured_type === response.structured_type) {
        seeded[id] = { ...response, link_id: fresh.link_id };
      }
    }
    store.set(responsesAtom, seeded);
    setDirty(true);
    setRestoreDismissed(true);
  }, [store, questionnaire]);

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
