import { Provider as JotaiProvider, createStore } from "jotai";
import { createContext, useContext, useEffect, useMemo } from "react";

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
  const store = useMemo(() => createStore(), []);

  // Re-seed whenever the questionnaire identity changes (builder preview
  // passes a fresh draft object on each Edit→Preview switch).
  useEffect(() => {
    store.set(questionnaireAtom, questionnaire);
    store.set(responsesAtom, initializeResponses(questionnaire.questions));
    store.set(activeGroupIndexAtom, 0);
  }, [questionnaire, store]);

  return (
    <RendererContext.Provider value={{ mode, subject, questionnaire }}>
      <JotaiProvider store={store}>{children}</JotaiProvider>
    </RendererContext.Provider>
  );
}
