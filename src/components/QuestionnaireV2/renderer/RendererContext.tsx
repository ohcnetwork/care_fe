import { Provider as JotaiProvider, createStore } from "jotai";
import { createContext, useContext, useEffect, useRef, useState } from "react";

import { QuestionnaireRead } from "@/types/questionnaire/questionnaire";

import {
  activeGroupIndexAtom,
  initializeResponses,
  questionnaireAtom,
  responsesAtom,
} from "./store";
import { RendererMode, RendererSubject } from "./types";

interface RendererContextValue {
  mode: RendererMode;
  subject: RendererSubject;
  questionnaire: QuestionnaireRead;
}

const RendererContext = createContext<RendererContextValue | null>(null);

export function useRenderer(): RendererContextValue {
  const context = useContext(RendererContext);
  if (!context) {
    throw new Error(
      "useRenderer must be used inside QuestionnaireRendererProvider",
    );
  }
  return context;
}

interface ProviderProps {
  questionnaire: QuestionnaireRead;
  mode: RendererMode;
  subject?: RendererSubject;
  children: React.ReactNode;
}

export function QuestionnaireRendererProvider({
  questionnaire,
  mode,
  subject = {},
  children,
}: ProviderProps) {
  // useState (not useMemo) guarantees the store is created exactly once per
  // component instance — React may discard a useMemo cache under memory
  // pressure, which would silently recreate the store and wipe any
  // in-progress answers. Seeding happens inside the initializer so the store
  // is never observed empty: derived selectors (useVisibleTopLevelIndices,
  // useQuestionResponse, …) would otherwise see questionnaireAtom === null
  // for the first render and blank the whole preview for one paint.
  const [store] = useState(() => {
    const seeded = createStore();
    seeded.set(questionnaireAtom, questionnaire);
    seeded.set(responsesAtom, initializeResponses(questionnaire.questions));
    return seeded;
  });

  // Re-seed only when the questionnaire identity changes after mount (the
  // builder preview passes a fresh draft object on each Edit→Preview
  // switch); the ref guard keeps the initial mount from re-running the seed.
  const seededQuestionnaire = useRef(questionnaire);
  useEffect(() => {
    if (seededQuestionnaire.current === questionnaire) return;
    seededQuestionnaire.current = questionnaire;
    store.set(questionnaireAtom, questionnaire);
    store.set(responsesAtom, initializeResponses(questionnaire.questions));
    store.set(activeGroupIndexAtom, 0);
  }, [questionnaire, store]);

  return (
    // Context carries the immutable mount config (mode/subject/questionnaire
    // identity); the atoms above are the reactive copy every selector reads.
    <RendererContext.Provider value={{ mode, subject, questionnaire }}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </RendererContext.Provider>
  );
}
