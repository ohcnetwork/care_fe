import { Provider as JotaiProvider, createStore } from "jotai";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { responseMap } from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  initializeResponses,
  questionnaireAtom,
  responsesAtom,
} from "@/components/QuestionnaireV2/form/engine/store";
import { findFirstQuestion } from "@/components/QuestionnaireV2/shared/questionTree";

export {
  useAnsweredQuestionIds,
  useHiddenQuestionIds,
} from "@/components/QuestionnaireV2/form/engine/store";

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
  /** Render inputs non-interactive and out of the a11y tree (builder edit canvas). */
  inert: boolean;
  /** The fill session is mid-submit: every question is read-only until it settles. */
  frozen: boolean;
}

const FormContext = createContext<FormContextValue | null>(null);

const EMPTY_SUBJECT: RendererSubject = {};

export function useFormRenderer(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error(
      "useFormRenderer must be used inside QuestionnaireFormProvider",
    );
  }
  return context;
}

/** `id → signature` per question; a changed signature re-seeds the answer
 *  on a live tree update. */
export function questionSignatures(questions: Question[]): Map<string, string> {
  const signatures = new Map<string, string>();
  const walk = (list: Question[]) => {
    for (const question of list) {
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
      walk(question.questions ?? []);
    }
  };
  walk(questions);
  return signatures;
}

/** Merge existing answers over a fresh seed: entries survive when the
 *  question still exists with the same signature, otherwise they re-seed. */
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
    let next = existing;
    if (seeded.sub_results) {
      const children =
        findFirstQuestion(questions, (question) => question.id === id)
          ?.questions ?? [];
      const rows = (existing.sub_results ?? []).map((row) => {
        const synced = Object.values(
          syncResponses(responseMap(row), previousSignatures, children),
        );
        return synced.length === row.length &&
          synced.every((entry, index) => entry === row[index])
          ? row
          : synced;
      });
      if (
        !existing.sub_results ||
        rows.some((row, index) => row !== existing.sub_results![index])
      ) {
        next = { ...existing, sub_results: rows };
      }
    }
    // Preserve identity when unchanged so subscribers bail out.
    merged[id] =
      next.link_id === seeded.link_id
        ? next
        : { ...next, link_id: seeded.link_id };
  }
  return merged;
}

interface ProviderProps {
  questionnaire: QuestionnaireRead;
  mode: FormMode;
  subject?: RendererSubject;
  revealHidden?: boolean;
  inert?: boolean;
  frozen?: boolean;
  /** Creation-time seed overrides (a restored draft), applied once; later
   *  changes have no effect. */
  initialResponses?: Record<string, QuestionnaireResponse>;
  children: React.ReactNode;
}

export function QuestionnaireFormProvider({
  questionnaire,
  mode,
  subject = EMPTY_SUBJECT,
  revealHidden = false,
  inert = false,
  frozen = false,
  initialResponses,
  children,
}: ProviderProps) {
  const [store] = useState(() => {
    const seeded = createStore();
    const responses = initializeResponses(questionnaire.questions);
    if (initialResponses) {
      for (const [id, entry] of Object.entries(initialResponses)) {
        const base = responses[id];
        if (base && base.structured_type === entry.structured_type) {
          responses[id] = { ...entry, question_id: id, link_id: base.link_id };
        }
      }
    }
    seeded.set(questionnaireAtom, questionnaire);
    seeded.set(responsesAtom, responses);
    return seeded;
  });

  const previousRef = useRef(questionnaire);
  useEffect(() => {
    if (previousRef.current === questionnaire) return;
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

  const value = useMemo(
    () => ({ mode, subject, questionnaire, revealHidden, inert, frozen }),
    [mode, subject, questionnaire, revealHidden, inert, frozen],
  );

  return (
    <FormContext.Provider value={value}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </FormContext.Provider>
  );
}
