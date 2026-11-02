import { useSyncExternalStore, type ReactNode } from "react";

import type { Question } from "@/types/questionnaire/question";

import { RegisteredGroupView } from "./RegisteredGroupView";
import {
  getQuestionGroup,
  getQuestionGroupsVersion,
  subscribeToQuestionGroups,
} from "./registry";
import { compatibleGroupFields, incompatibleGroupQuestions } from "./schema";
import { storedGroupFields, type StoredGroupAnswer } from "./storedGroupFields";

const noop = () => {};

export function RegisteredGroupAnswerView({
  question,
  responses,
  fallback,
}: {
  question: Question;
  responses: readonly StoredGroupAnswer[];
  fallback: ReactNode;
}) {
  useSyncExternalStore(
    subscribeToQuestionGroups,
    getQuestionGroupsVersion,
    getQuestionGroupsVersion,
  );
  const definition = question.structured_type
    ? getQuestionGroup(question.structured_type)
    : undefined;
  // Saved fields the current plugin schema no longer matches would be hidden
  // by the custom view, so show the generic answers instead.
  if (
    !definition ||
    incompatibleGroupQuestions(question, definition).length > 0
  ) {
    return <>{fallback}</>;
  }
  const schema = compatibleGroupFields(question, definition);
  const rows = question.repeats
    ? (responses.find((response) => response.question_id === question.id)
        ?.sub_results ?? [])
    : [];
  return (
    <RegisteredGroupView
      question={question}
      fields={storedGroupFields(schema, question.repeats ? [] : responses)}
      onChange={noop}
      rows={rows.map((row, index) => ({
        // Saved answer snapshots expose no row mutation operations.
        key: index,
        fields: storedGroupFields(schema, row),
        onChange: noop,
        remove: noop,
      }))}
      addRow={noop}
      disabled
      fallback={fallback}
    />
  );
}
