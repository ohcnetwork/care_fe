import { ComponentType, ReactNode, createContext, useContext } from "react";

import type { Question } from "@/types/questionnaire/question";

/**
 * The decoration seam: a host (the studio's edit canvas) wraps every
 * rendered question block with its own chrome — selection ring, floating
 * toolbar, click-to-select — without the renderer knowing the builder
 * exists. Preview/readonly/fill hosts provide no chrome and the renderer
 * output is exactly the plain form.
 */
export interface QuestionShellProps {
  question: Question;
  parentId: string | null;
  /** Position within the sibling list — drives move up/down affordances. */
  index: number;
  siblingCount: number;
  depth: number;
  number?: string;
  /** enable_when currently evaluates false (rendered only under
   *  `revealHidden`) — chrome shows a "hidden by conditions" cue. */
  hiddenByLogic: boolean;
  children: ReactNode;
}

export interface FormChrome {
  /** Wraps each question block. Return `children` untouched to opt out at
   *  a given depth. */
  QuestionShell?: ComponentType<QuestionShellProps>;
  /** Rendered after the children of a group (`parentId` = group id) and
   *  after the top-level list (`parentId` = null) — the "add question
   *  here" affordance. */
  AppendZone?: ComponentType<{ parentId: string | null }>;
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
