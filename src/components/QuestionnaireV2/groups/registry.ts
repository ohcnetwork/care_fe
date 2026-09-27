import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { QuestionnaireResponse } from "@/types/questionnaire/form";
import { QUESTION_TYPES, type Question } from "@/types/questionnaire/question";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import {
  PLUGIN_STRUCTURED_TYPE_PATTERN,
  type PluginStructuredTypeName,
} from "@/types/questionnaire/structured";

export interface GroupQuestionDefinition extends Omit<
  Question,
  "id" | "questions"
> {
  questions?: GroupQuestionDefinition[];
}

export interface GroupBuilderProps {
  question: Question;
  onChange: (patch: Partial<Question>) => void;
}

export interface GroupField {
  question: Question;
  response: QuestionnaireResponse;
  disabled: boolean;
  hidden: boolean;
  errors: readonly QuestionValidationError[];
}

export interface GroupRow {
  /** Local schema link_id → binding; missing or incompatible fields are null. */
  fields: Record<string, GroupField | null>;
  onChange: (updates: Record<string, Partial<QuestionnaireResponse>>) => void;
  remove: () => void;
}

export interface GroupInputProps {
  question: Question;
  /** For repeating groups, these are the template bindings for a new row. */
  fields: Record<string, GroupField | null>;
  onChange: GroupRow["onChange"];
  /** Repeating groups keep each row's ordinary child answers in core state. */
  rows: GroupRow[];
  addRow: (updates?: Record<string, Partial<QuestionnaireResponse>>) => void;
  disabled: boolean;
}

export interface RegisteredGroupDefinition {
  type: PluginStructuredTypeName;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  subjects: readonly SubjectType[];
  repeats?: boolean;
  schema: readonly GroupQuestionDefinition[];
  builder: ComponentType<GroupBuilderProps>;
  component: ComponentType<GroupInputProps>;
}

const groups = new Map<string, RegisteredGroupDefinition>();
const listeners = new Set<() => void>();
let version = 0;
const notify = () => {
  version += 1;
  listeners.forEach((listener) => listener());
};

export function registerQuestionGroup(
  definition: RegisteredGroupDefinition,
  ownerSlug: string,
): () => void {
  if (
    !PLUGIN_STRUCTURED_TYPE_PATTERN.test(definition.type) ||
    definition.type.split(".")[0] !== ownerSlug
  ) {
    throw new Error(`Invalid registered group namespace: ${definition.type}`);
  }
  const keys = new Set<string>();
  const validate = (questions: readonly GroupQuestionDefinition[]) => {
    for (const question of questions) {
      if (
        typeof question.link_id !== "string" ||
        !/^[A-Za-z_][A-Za-z0-9_]*$/.test(question.link_id) ||
        question.link_id.includes("__") ||
        keys.has(question.link_id)
      ) {
        throw new Error(
          `Invalid or duplicate group field: ${question.link_id}`,
        );
      }
      keys.add(question.link_id);
      if (
        !QUESTION_TYPES.includes(question.type) ||
        (question.type === "group" &&
          (!question.questions?.length || question.repeats))
      ) {
        throw new Error(
          `Unsupported registered group field: ${question.link_id}`,
        );
      }
      validate(question.questions ?? []);
    }
  };
  validate(definition.schema);
  if (!keys.size) throw new Error("A registered group needs child questions");
  groups.set(definition.type, definition);
  notify();
  return () => {
    if (groups.get(definition.type) === definition) {
      groups.delete(definition.type);
      notify();
    }
  };
}

export const getQuestionGroup = (type: string) => groups.get(type);
export const listQuestionGroups = () => Array.from(groups.values());
export const getQuestionGroupsVersion = () => version;
export function subscribeToQuestionGroups(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
