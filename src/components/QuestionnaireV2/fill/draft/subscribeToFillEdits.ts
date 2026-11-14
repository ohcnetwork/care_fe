import { responsesAtom } from "@/components/QuestionnaireV2/form/engine/store";

import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { FormStore } from "@/components/QuestionnaireV2/fill/StoreRegistrar";
import { sessionEditSignature } from "./fillDraftStore";

interface ObservedForm {
  questionnaire: QuestionnaireRead;
  store: FormStore;
}

interface FillEditCallbacks {
  isFinished: () => boolean;
  onEdit: () => void;
  persist: () => void;
}

const AUTOSAVE_DEBOUNCE_MS = 1500;

/** Own the subscriptions and shared debounce for one committed form list.
 * Each store compares only its own clinician input, including structured
 * draft intent. Initial server prefill is a baseline, not an edit.
 *
 * The caller owns pagehide and React lifecycle; disposal flushes the last
 * edit and releases every subscription, even if persistence throws. */
export function subscribeToFillEdits(
  forms: ObservedForm[],
  { isFinished, onEdit, persist }: FillEditCallbacks,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let disposed = false;

  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
    if (!isFinished()) persist();
  };

  const unsubscribers = forms.map(({ questionnaire, store }) => {
    const signature = () =>
      sessionEditSignature([
        { questionnaire, responses: store.get(responsesAtom) },
      ]);
    let previousSignature = signature();
    return store.sub(responsesAtom, () => {
      if (disposed || isFinished()) return;
      const nextSignature = signature();
      if (previousSignature === nextSignature) return;
      previousSignature = nextSignature;
      onEdit();
      clearTimeout(timer);
      timer = setTimeout(flush, AUTOSAVE_DEBOUNCE_MS);
    });
  });

  return {
    flush,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      try {
        flush();
      } finally {
        for (const unsubscribe of unsubscribers) unsubscribe();
      }
    },
  };
}
