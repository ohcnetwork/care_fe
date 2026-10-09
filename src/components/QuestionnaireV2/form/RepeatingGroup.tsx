import { Plus, X } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import type { Question } from "@/types/questionnaire/question";

import { ResponseRowProvider, useResponseScope } from "./engine/responseScope";
import { EMPTY_ROW_KEYS, dropRowKey, growRowKeys } from "./engine/rowKeys";
import {
  initializeResponses,
  useQuestionErrors,
  useQuestionResponse,
} from "./engine/store";
import { useFormRenderer } from "./FormContext";
import { SectionCard } from "./SectionCard";

/** Ordinary repeating groups own their rows in the same store as all inputs. */
export function RepeatingGroup(props: {
  question: Question;
  depth: number;
  disabled: boolean;
  number?: string;
}) {
  const { question, disabled } = props;
  const { t } = useTranslation();
  const { inert, mode } = useFormRenderer();
  const path = useResponseScope();
  const [response, update] = useQuestionResponse(question.id);
  const errors = useQuestionErrors(question.id);
  const rows = response?.sub_results ?? [];
  const [rowKeys, setRowKeys] = useState(EMPTY_ROW_KEYS);
  const keys = growRowKeys(rowKeys, rows.length);
  if (keys !== rowKeys) setRowKeys(keys);
  if (inert) return <SectionCard {...props} />;

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
      {rows.map((row, index) => (
        <div
          key={keys.keys[index]}
          data-group-row={index}
          className="space-y-2 rounded-lg border border-gray-200 p-2"
        >
          <ResponseRowProvider groupId={question.id} rowIndex={index}>
            <SectionCard
              {...props}
              depth={props.depth + 1}
              number={`${index + 1}.`}
            />
          </ResponseRowProvider>
          {mode !== "readonly" && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={disabled}
              onClick={() => {
                setRowKeys((current) =>
                  dropRowKey(current, rows.length, index),
                );
                update({
                  sub_results: rows.filter((candidate) => candidate !== row),
                });
              }}
            >
              <X className="size-4" />
              {t("remove")}
            </Button>
          )}
        </div>
      ))}
      {mode !== "readonly" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() =>
            update({
              sub_results: [
                ...rows,
                Object.values(initializeResponses(question.questions ?? [])),
              ],
            })
          }
        >
          <Plus className="size-4" />
          {t("add_another")}
        </Button>
      )}
      {errors.map((error, index) => (
        <p key={index} role="alert" className="text-sm text-red-600">
          {error.msg ?? error.error}
        </p>
      ))}
    </section>
  );
}
