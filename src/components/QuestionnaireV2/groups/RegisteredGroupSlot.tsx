import { useAtomValue, useStore } from "jotai";
import { useState, useSyncExternalStore } from "react";
import { useTranslation } from "react-i18next";

import {
  ResponseRowProvider,
  getScopedResponses,
  responseMap,
  sameResponsePath,
  updateResponsesAtPath,
  useResponseScope,
} from "@/components/QuestionnaireV2/form/engine/responseScope";
import {
  EMPTY_ROW_KEYS,
  growRowKeys,
} from "@/components/QuestionnaireV2/form/engine/rowKeys";
import {
  errorsAtom,
  initializeResponses,
  responsesAtom,
  useScopedResponses,
} from "@/components/QuestionnaireV2/form/engine/store";
import { useFormRenderer } from "@/components/QuestionnaireV2/form/FormContext";
import { QuestionBlock } from "@/components/QuestionnaireV2/form/QuestionBlock";
import { RepeatingGroup } from "@/components/QuestionnaireV2/form/RepeatingGroup";
import { SectionCard } from "@/components/QuestionnaireV2/form/SectionCard";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import type { Question } from "@/types/questionnaire/question";

import {
  groupBindings,
  retainGroupRowErrors,
  updateGroupResponses,
  updateGroupRows,
  type GroupRowAction,
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
  const [rowKeys, setRowKeys] = useState(EMPTY_ROW_KEYS);
  const definition = question.structured_type
    ? getQuestionGroup(question.structured_type)
    : undefined;
  if (!definition || !definition.subjects.includes(questionnaire.subject_type))
    return question.repeats ? (
      <RepeatingGroup {...props} />
    ) : (
      <SectionCard {...props} />
    );
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
    store.set(
      responsesAtom,
      updateResponsesAtPath(
        current,
        path,
        Object.fromEntries(
          Object.entries(next).filter(
            ([id, response]) => response !== scoped[id],
          ),
        ),
      ),
    );
    store.set(errorsAtom, (previous) =>
      previous.filter(
        (error) =>
          !sameResponsePath(error.response_path, path) ||
          scoped[error.question_id] === next[error.question_id],
      ),
    );
  };
  const changeRows = (action: GroupRowAction) => {
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
    const nextRows = next[question.id]?.sub_results ?? [];
    store.set(errorsAtom, (previous) =>
      retainGroupRowErrors(
        previous,
        path,
        question.id,
        action,
        scoped[question.id]?.sub_results ?? [],
        nextRows,
      ),
    );
    return nextRows;
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
  const keys = growRowKeys(rowKeys, rows.length);
  if (keys !== rowKeys) setRowKeys(keys);
  const incompatible =
    incompatibleGroupQuestions(question, definition).length > 0;
  const children = question.questions ?? [];
  const renderChildren = () =>
    children.map((child, index) => (
      <QuestionBlock
        key={child.id}
        question={child}
        parentId={question.id}
        index={index}
        siblingCount={children.length}
        depth={props.depth + 1}
        number={props.number ? `${props.number}${index + 1}.` : undefined}
      />
    ));
  const fallback = (
    <fieldset disabled={disabled && !inert} className="space-y-3 border-0 p-0">
      {question.repeats
        ? rows.map((_, index) => (
            <ResponseRowProvider
              key={keys.keys[index]}
              groupId={question.id}
              rowIndex={index}
            >
              {renderChildren()}
            </ResponseRowProvider>
          ))
        : renderChildren()}
    </fieldset>
  );
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
