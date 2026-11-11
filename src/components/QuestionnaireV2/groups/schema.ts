import type { Question } from "@/types/questionnaire/question";

import {
  getQuestionGroup,
  type GroupQuestionDefinition,
  type RegisteredGroupDefinition,
} from "./registry";

export function groupFieldKey(
  group: Question,
  child: Question,
): string | undefined {
  const prefix = `${group.link_id}__`;
  return child.link_id.startsWith(prefix)
    ? child.link_id.slice(prefix.length)
    : undefined;
}

function scopeGroupQuestions(
  group: Question,
  schema: readonly GroupQuestionDefinition[],
  getId: (localKey: string) => string,
): Question[] {
  const localIds = new Set<string>();
  const collect = (questions: readonly GroupQuestionDefinition[]) => {
    for (const question of questions) {
      localIds.add(question.link_id);
      collect(question.questions ?? []);
    }
  };
  collect(schema);
  const walk = (questions: readonly GroupQuestionDefinition[]): Question[] =>
    questions.map((question) => ({
      ...structuredClone(question),
      id: getId(question.link_id),
      link_id: `${group.link_id}__${question.link_id}`,
      enable_when: question.enable_when?.map((condition) => ({
        ...condition,
        question: localIds.has(condition.question)
          ? `${group.link_id}__${condition.question}`
          : condition.question,
      })),
      questions: question.questions ? walk(question.questions) : undefined,
    }));
  return walk(schema);
}

export function instantiateGroupQuestions(
  group: Question,
  schema: readonly GroupQuestionDefinition[],
): Question[] {
  return scopeGroupQuestions(group, schema, () => crypto.randomUUID());
}

/** Replace the managed schema, retaining field identity even when nesting changes. */
export function repairGroupSchema(
  group: Question,
  definition: RegisteredGroupDefinition,
): Partial<Question> {
  const savedIds = new Map<string, string>();
  const collect = (questions: readonly Question[]) => {
    for (const question of questions) {
      const key = groupFieldKey(group, question);
      if (key && !savedIds.has(key)) savedIds.set(key, question.id);
      collect(question.questions ?? []);
    }
  };
  collect(group.questions ?? []);
  return {
    repeats: !!definition.repeats,
    questions: scopeGroupQuestions(
      group,
      definition.schema,
      (key) => savedIds.get(key) ?? crypto.randomUUID(),
    ),
  };
}

const booleanQuestionFields = new Set([
  "required",
  "is_component",
  "collect_time",
  "collect_performer",
  "collect_body_site",
  "collect_method",
  "repeats",
  "read_only",
  "is_observation",
]);

/** Backend reads may include nulls and empty defaults omitted in plug schemas. */
function normalizeSchemaValue(value: unknown): unknown {
  if (value == null) return undefined;
  if (Array.isArray(value)) {
    return value.length ? value.map(normalizeSchemaValue) : undefined;
  }
  if (typeof value === "object") {
    const entries = Object.entries(value)
      .map(([key, child]) => [key, normalizeSchemaValue(child)] as const)
      .filter(([, child]) => child !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return entries.length ? Object.fromEntries(entries) : undefined;
  }
  return value;
}

function comparableQuestions(questions: readonly Question[]): unknown {
  return normalizeSchemaValue(
    questions.map((question) => ({
      ...Object.fromEntries(
        Object.entries(question).filter(
          ([key, value]) =>
            key !== "id" && !(booleanQuestionFields.has(key) && !value),
        ),
      ),
      answer_option: question.answer_option?.map((option) => ({
        // AnswerOption persists these two fields; display/code are UI hints.
        value: option.value,
        initial_selected: option.initial_selected || undefined,
      })),
      questions: comparableQuestions(question.questions ?? []),
    })),
  );
}

/** Editor-only comparison; unlike fill compatibility, missing fields need repair. */
export function groupSchemaNeedsRepair(
  group: Question,
  definition: RegisteredGroupDefinition,
): boolean {
  return (
    !!group.repeats !== !!definition.repeats ||
    JSON.stringify(comparableQuestions(group.questions ?? [])) !==
      JSON.stringify(
        comparableQuestions(
          scopeGroupQuestions(group, definition.schema, () => ""),
        ),
      )
  );
}

function sameField(
  saved: Question,
  expected: GroupQuestionDefinition,
): boolean {
  return (
    saved.type === expected.type &&
    !!saved.repeats === !!expected.repeats &&
    (saved.structured_type ?? null) === (expected.structured_type ?? null) &&
    JSON.stringify(
      (saved.answer_option ?? []).map((option) => option.value).sort(),
    ) ===
      JSON.stringify(
        (expected.answer_option ?? []).map((option) => option.value).sort(),
      ) &&
    saved.answer_value_set?.slug === expected.answer_value_set?.slug &&
    saved.answer_value_set?.external_id ===
      expected.answer_value_set?.external_id
  );
}

/** Match within the saved tree, including ancestry. Never regenerate a fill schema. */
export function compatibleGroupFields(
  group: Question,
  definition: RegisteredGroupDefinition,
): Record<string, Question | null> {
  const fields: Record<string, Question | null> = {};
  const savedChildren =
    !!group.repeats === !!definition.repeats ? (group.questions ?? []) : [];
  const walk = (
    schema: readonly GroupQuestionDefinition[],
    saved: readonly Question[],
  ) => {
    for (const expected of schema) {
      const candidates = saved.filter(
        (child) => groupFieldKey(group, child) === expected.link_id,
      );
      const match =
        candidates.length === 1 && sameField(candidates[0], expected)
          ? candidates[0]
          : null;
      fields[expected.link_id] = match;
      walk(expected.questions ?? [], match?.questions ?? []);
    }
  };
  walk(definition.schema, savedChildren);
  return fields;
}

export function incompatibleGroupQuestions(
  group: Question,
  definition: RegisteredGroupDefinition,
): Question[] {
  if (!!group.repeats !== !!definition.repeats) return [group];
  const matched = new Set(
    Object.values(compatibleGroupFields(group, definition))
      .filter((question) => question !== null)
      .map((question) => question.id),
  );
  const unmatched: Question[] = [];
  const walk = (questions: Question[]) => {
    for (const question of questions) {
      if (!matched.has(question.id)) unmatched.push(question);
      else walk(question.questions ?? []);
    }
  };
  walk(group.questions ?? []);
  return unmatched;
}

/** Only incompatible saved fields need an editor update; added fields are nullable. */
export function groupsNeedingSchemaUpdate(
  questions: Question[],
  isEnabled: (question: Question) => boolean = () => true,
): Question[] {
  return questions.flatMap((question) => {
    if (!isEnabled(question)) return [];
    const definition =
      question.type === "group" && question.structured_type
        ? getQuestionGroup(question.structured_type)
        : undefined;
    if (definition && incompatibleGroupQuestions(question, definition).length)
      return [question];
    return groupsNeedingSchemaUpdate(question.questions ?? [], isEnabled);
  });
}
