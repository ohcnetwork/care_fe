import { ComponentType, ReactNode, createContext, useContext } from "react";

import type { Question } from "@/types/questionnaire/question";

export interface QuestionShellProps {
  question: Question;
  parentId: string | null;
  index: number;
  siblingCount: number;
  depth: number;
  number?: string;
  /** enable_when evaluates false; rendered only under `revealHidden`. */
  hiddenByLogic: boolean;
  children: ReactNode;
}

/** Host-provided decoration around the renderer's output (the studio's
 *  edit canvas); every slot is optional. */
export interface FormChrome {
  /** Wraps each question block. */
  QuestionShell?: ComponentType<QuestionShellProps>;
  /** Rendered after a group's children (`parentId` = group id) and after
   *  the top-level list (`parentId` = null). */
  AppendZone?: ComponentType<{ parentId: string | null }>;
  /** Rendered between a block's label and its input area. */
  QuestionAnnotation?: ComponentType<{ question: Question }>;
}

const ChromeContext = createContext<FormChrome>({});

export function useFormChrome(): FormChrome {
  return useContext(ChromeContext);
}

export function FormChromeProvider({
  chrome,
  children,
}: {
  chrome: FormChrome;
  children: ReactNode;
}) {
  return (
    <ChromeContext.Provider value={chrome}>{children}</ChromeContext.Provider>
  );
}
