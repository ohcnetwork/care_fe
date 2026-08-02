import { Provider as JotaiProvider, createStore } from "jotai";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import {
  initializeResponses,
  questionnaireAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/renderer/store";

// Live-store hooks hosts may need (the studio outline drops
// enable_when-hidden rows in preview). Re-exported here so consumers stay
// on form/'s public surface — the engine reach-in is this module's alone.
export { useHiddenQuestionIds } from "@/components/QuestionnaireV2/renderer/store";

import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";
import type { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import type { FormMode, RendererSubject } from "./types";

interface FormContextValue {
  mode: FormMode;
  subject: RendererSubject;
  questionnaire: QuestionnaireRead;
  /** Render enable_when-hidden questions anyway (builder edit canvas). */
  revealHidden: boolean;
  /** Render inputs visually but non-interactive and out of the a11y tree
   *  (builder edit canvas — clicks land on the selection chrome instead). */
  inert: boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

export function useFormRenderer(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      "useFormRenderer must be used inside QuestionnaireFormProvider",
    );
  }
  return context;
}

/**
 * `id → signature` for every non-group question — the key that decides
 * whether an in-progress answer survives a live tree update. Participates:
 * type/structured_type (a differently-shaped value must not linger),
 * answer options (value + default flag — a changed `initial_selected` must
 * reach the preview, and a recorded answer can't point at a removed
 * option), `repeats` (turning it off collapses rendering to `values[0]`
 * while enable_when and required validation still scan every entry — extra
 * entries would be invisible but live), and the answer value set (swapping
 * sets would leave the old set's `coding` recorded).
 */
function questionSignatures(questions: Question[]): Map<string, string> {
  const signatures = new Map<string, string>();
  const walk = (list: Question[]) => {
    for (const question of list) {
      if (question.type === "group") {
        walk(question.questions ?? []);
        continue;
      }
      const options = (question.answer_option ?? [])
        .map((option) => `${option.value}=${option.initial_selected ? 1 : 0}`)
        .join("|");
      const valueSet = question.answer_value_set
        ? `${question.answer_value_set.slug ?? ""}/${question.answer_value_set.external_id ?? ""}`
        : "";
      signatures.set(
        question.id,
        `${question.type}:${question.structured_type ?? ""}:${question.repeats ? 1 : 0}:${valueSet}:${options}`,
      );
    }
  };
  walk(questions);
  return signatures;
}

/**
 * Live-update merge — the difference from the old renderer's wholesale
 * re-seed (which wiped every in-progress answer whenever the questionnaire
 * identity changed). Entries survive when the question id still exists with
 * the same type/structured_type; added questions get fresh seeded entries
 * (`initial_selected` options); removed questions drop; a type change
 * re-seeds that one entry so a stale value of another shape can't linger in
 * enable_when evaluation.
 */
export function syncResponses(
  previous: Record<string, QuestionnaireResponse>,
  previousSignatures: Map<string, string>,
  questions: Question[],
): Record<string, QuestionnaireResponse> {
  const fresh = initializeResponses(questions);
  const nextSignatures = questionSignatures(questions);
  const merged: Record<string, QuestionnaireResponse> = {};
  for (const [id, seeded] of Object.entries(fresh)) {
    const existing = previous[id];
    if (!existing || previousSignatures.get(id) !== nextSignatures.get(id)) {
      merged[id] = seeded;
      continue;
    }
    // Preserve object identity when nothing about the entry changed, so
    // each useQuestionResponse derived atom keeps its Jotai bail-out —
    // a title keystroke in the builder must not re-render every block.
    merged[id] =
      existing.link_id === seeded.link_id
        ? existing
        : { ...existing, link_id: seeded.link_id };
  }
  return merged;
}

interface ProviderProps {
  questionnaire: QuestionnaireRead;
  mode: FormMode;
  subject?: RendererSubject;
  revealHidden?: boolean;
  inert?: boolean;
  children: React.ReactNode;
}

export function QuestionnaireFormProvider({
  questionnaire,
  mode,
  subject = {},
  revealHidden = false,
  inert = false,
  children,
}: ProviderProps) {
  // useState (not useMemo) so the store is created exactly once per instance
  // and never observed unseeded (same rationale as the old provider).
  const [store] = useState(() => {
    const seeded = createStore();
    seeded.set(questionnaireAtom, questionnaire);
    seeded.set(responsesAtom, initializeResponses(questionnaire.questions));
    return seeded;
  });

  // Live sync: every questionnaire identity change re-points the atom and
  // merges responses instead of wiping them — this is what lets the builder
  // feed a fresh draft object per keystroke while preview answers persist.
  const previousRef = useRef(questionnaire);
  useEffect(() => {
    if (previousRef.current === questionnaire) return;
    // Metadata-only drafts (Form-settings title/description ride along in
    // the studio draft) leave the question tree referentially identical —
    // re-point the questionnaire atom, skip the response merge entirely.
    if (previousRef.current.questions === questionnaire.questions) {
      previousRef.current = questionnaire;
      store.set(questionnaireAtom, questionnaire);
      return;
    }
    const previousSignatures = questionSignatures(
      previousRef.current.questions,
    );
    previousRef.current = questionnaire;
    store.set(questionnaireAtom, questionnaire);
    store.set(
      responsesAtom,
      syncResponses(
        store.get(responsesAtom),
        previousSignatures,
        questionnaire.questions,
      ),
    );
  }, [questionnaire, store]);

  return (
    <FormContext.Provider
      value={{ mode, subject, questionnaire, revealHidden, inert }}
    >
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </FormContext.Provider>
  );
}
