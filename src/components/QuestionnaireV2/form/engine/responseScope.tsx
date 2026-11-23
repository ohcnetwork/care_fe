import { createContext, useContext, useMemo, type ReactNode } from "react";

import type {
  QuestionnaireResponse,
  ResponsePath,
} from "@/types/questionnaire/form";

const ROOT_PATH: ResponsePath = [];
const ResponseScope = createContext<ResponsePath>(ROOT_PATH);

export const useResponseScope = () => useContext(ResponseScope);

export function ResponseRowProvider({
  groupId,
  rowIndex,
  children,
}: {
  groupId: string;
  rowIndex: number;
  children: ReactNode;
}) {
  const parent = useResponseScope();
  const path = useMemo(
    () => [...parent, { questionId: groupId, rowIndex }],
    [parent, groupId, rowIndex],
  );
  return (
    <ResponseScope.Provider value={path}>{children}</ResponseScope.Provider>
  );
}

export function responseMap(
  row: readonly QuestionnaireResponse[],
): Record<string, QuestionnaireResponse> {
  return Object.fromEntries(
    row.map((response) => [response.question_id, response]),
  );
}

export function getResponsesAtPath(
  responses: Record<string, QuestionnaireResponse>,
  path: ResponsePath,
): Record<string, QuestionnaireResponse> {
  let current = responses;
  for (const { questionId, rowIndex } of path) {
    current = responseMap(current[questionId]?.sub_results?.[rowIndex] ?? []);
  }
  return current;
}

/** Root responses overlaid with each row on the path; what a registered
 *  group component receives. Not used for enable_when. */
export function getScopedResponses(
  responses: Record<string, QuestionnaireResponse>,
  path: ResponsePath,
): Record<string, QuestionnaireResponse> {
  let current = responses;
  let scoped = responses;
  for (const { questionId, rowIndex } of path) {
    current = responseMap(current[questionId]?.sub_results?.[rowIndex] ?? []);
    scoped = { ...scoped, ...current };
  }
  return scoped;
}

export function updateResponsesAtPath(
  responses: Record<string, QuestionnaireResponse>,
  path: ResponsePath,
  updates: Record<string, Partial<QuestionnaireResponse>>,
): Record<string, QuestionnaireResponse> {
  if (!path.length) {
    const next = { ...responses };
    for (const [id, update] of Object.entries(updates)) {
      if (responses[id]) next[id] = { ...responses[id], ...update };
    }
    return next;
  }
  const [{ questionId, rowIndex }, ...remaining] = path;
  const group = responses[questionId];
  const row = group?.sub_results?.[rowIndex];
  if (!row) return responses;
  const updated = updateResponsesAtPath(responseMap(row), remaining, updates);
  return {
    ...responses,
    [questionId]: {
      ...group,
      sub_results: group.sub_results!.map((entry, index) =>
        index === rowIndex ? Object.values(updated) : entry,
      ),
    },
  };
}

export function sameResponsePath(
  left: ResponsePath = ROOT_PATH,
  right: ResponsePath = ROOT_PATH,
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (entry, index) =>
        entry.questionId === right[index].questionId &&
        entry.rowIndex === right[index].rowIndex,
    )
  );
}
