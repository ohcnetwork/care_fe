import { useAtomValue, useStore } from "jotai";
import { useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import {
  getScopedResponses,
  responseMap,
  sameResponsePath,
  updateResponsesAtPath,
  useResponseScope,
} from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  errorsAtom,
  initializeResponses,
  responsesAtom,
  useScopedResponses,
} from "@/components/QuestionnaireV2/form/engine/store";
import { useFormRenderer } from "@/components/QuestionnaireV2/form/FormContext";
import { RepeatingGroup } from "@/components/QuestionnaireV2/form/RepeatingGroup";
import { SectionCard } from "@/components/QuestionnaireV2/form/SectionCard";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import {
  groupBindings,
  updateGroupResponses,
  updateGroupRows,
} from "./bindings";
import { RegisteredGroupView } from "./RegisteredGroupView";
import {
  getQuestionGroup,
  getQuestionGroupsVersion,
  subscribeToQuestionGroups,
  type GroupInputProps,
} from "./registry";
import { incompatibleGroupQuestions } from "./schema";

export function RegisteredGroupSlot(props: {
  question: Question;
  depth: number;
  disabled: boolean;
  number?: string;
}) {
  const { question, disabled } = props;
  const { t } = useTranslation();
  const { questionnaire, inert, frozen, mode } = useFormRenderer();
  const store = useStore();
  const path = useResponseScope();
  const responses = useScopedResponses();
  const errors = useAtomValue(errorsAtom);
  useSyncExternalStore(
    subscribeToQuestionGroups,
    getQuestionGroupsVersion,
    getQuestionGroupsVersion,
  );
  const definition = question.structured_type
    ? getQuestionGroup(question.structured_type)
    : undefined;
  const fallback = question.repeats ? (
    <RepeatingGroup {...props} />
  ) : (
    <SectionCard {...props} />
  );
  if (!definition || !definition.subjects.includes(questionnaire.subject_type))
    return fallback;
  const locked = disabled || inert || frozen || mode === "readonly";
  const scopedErrors = errors.filter((error) =>
    sameResponsePath(error.response_path, path),
  );
  const fields = groupBindings(
    question,
    definition,
    questionnaire.questions,
    question.repeats
      ? { ...responses, ...initializeResponses(question.questions ?? []) }
      : responses,
    question.repeats ? [] : scopedErrors,
    locked,
  );
  const onChange: GroupInputProps["onChange"] = (updates) => {
    if (locked || question.repeats) return;
    const current = store.get(responsesAtom);
    const scoped = getScopedResponses(current, path);
    const next = updateGroupResponses(
      question,
      definition,
      questionnaire.questions,
      scoped,
      updates,
    );
    store.set(responsesAtom, updateResponsesAtPath(current, path, next));
    store.set(errorsAtom, (previous) =>
      previous.filter(
        (error) =>
          !sameResponsePath(error.response_path, path) ||
          scoped[error.question_id] === next[error.question_id],
      ),
    );
  };
  const changeRows = (action: Parameters<typeof updateGroupRows>[4]) => {
    if (locked) return;
    const current = store.get(responsesAtom);
    const scoped = getScopedResponses(current, path);
    const next = updateGroupRows(
      question,
      definition,
      questionnaire.questions,
      scoped,
      action,
    );
    store.set(
      responsesAtom,
      updateResponsesAtPath(current, path, {
        [question.id]: next[question.id],
      }),
    );
    store.set(errorsAtom, (previous) =>
      previous.filter((error) => {
        if (
          sameResponsePath(error.response_path, path) &&
          error.question_id === question.id
        )
          return false;
        const rowPath = error.response_path ?? [];
        return (
          !sameResponsePath(rowPath.slice(0, path.length), path) ||
          rowPath[path.length]?.questionId !== question.id
        );
      }),
    );
    return next[question.id]?.sub_results;
  };
  const rows = (
    question.repeats ? (responses[question.id]?.sub_results ?? []) : []
  ).map((row, index) => {
    let currentRow: QuestionnaireResponse[] = row;
    return {
      fields: groupBindings(
        question,
        definition,
        questionnaire.questions,
        { ...responses, ...responseMap(row) },
        errors.filter(
          (error) =>
            !error.response_path ||
            sameResponsePath(error.response_path, [
              ...path,
              { questionId: question.id, rowIndex: index },
            ]),
        ),
        locked,
      ),
      onChange: (updates: Parameters<GroupInputProps["onChange"]>[0]) => {
        const currentRows =
          getScopedResponses(store.get(responsesAtom), path)[question.id]
            ?.sub_results ?? [];
        const currentIndex = currentRows.indexOf(currentRow);
        const next = changeRows({ type: "update", row: currentRow, updates });
        if (next && currentIndex >= 0) currentRow = next[currentIndex];
      },
      remove: () => {
        changeRows({ type: "remove", row: currentRow });
      },
    };
  });
  const incompatible =
    incompatibleGroupQuestions(question, definition).length > 0;
  return (
    <section
      data-question-id={question.id}
      data-response-path={JSON.stringify(path)}
      className="space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-3.5"
    >
      <h3 className="text-sm font-semibold">
        {props.number} {question.text}
      </h3>
      {question.description && (
        <p className="text-sm text-gray-600">{question.description}</p>
      )}
      {incompatible && (
        <p role="alert" className="text-sm text-amber-800">
          {t("registered_group_schema_update_required")}
        </p>
      )}
      {scopedErrors
        .filter((error) => error.question_id === question.id)
        .map((error, index) => (
          <p key={index} role="alert" className="text-sm text-red-600">
            {error.msg ?? error.error}
          </p>
        ))}
      <div inert={inert || undefined}>
        <RegisteredGroupView
          question={question}
          fields={fields}
          onChange={onChange}
          rows={rows}
          addRow={(updates = {}) => {
            changeRows({ type: "add", updates });
          }}
          disabled={locked}
          fallback={fallback}
        />
      </div>
      {[
        question.repeats ? {} : fields,
        ...rows.map((row) => row.fields),
      ].flatMap((fields, rowIndex) =>
        Object.values(fields).map(
          (field) =>
            field &&
            !field.hidden && (
              <div
                key={`${rowIndex}:${field.question.id}`}
                data-question-id={field.question.id}
                data-response-path={JSON.stringify(
                  rowIndex === 0
                    ? path
                    : [
                        ...path,
                        { questionId: question.id, rowIndex: rowIndex - 1 },
                      ],
                )}
                aria-label={field.question.text}
                tabIndex={-1}
              >
                {field.errors.map((error, index) => (
                  <p key={index} role="alert" className="text-sm text-red-600">
                    {field.question.text}: {error.msg ?? error.error}
                  </p>
                ))}
              </div>
            ),
        ),
      )}
    </section>
  );
}
