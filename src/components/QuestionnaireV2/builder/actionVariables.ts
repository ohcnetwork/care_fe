/**
 * What an action may refer to: the questionnaire's own answers and the
 * context values the backend registry exposes from the submission root.
 * Pure — the editor components and the save rules both read from here.
 */
import { ActionContextField } from "@/types/questionnaire/actions";
import { Question, QuestionType } from "@/types/questionnaire/question";

import {
  ActionRuleOperator,
  isIdentifierSafeLinkId,
  linkIdOfRef,
  questionRef,
} from "@/components/QuestionnaireV2/shared/actionExpression";

/** How the backend's cleaned answer for a question compares — decides the
 *  operator set, the value control, and whether the answer is a scalar or
 *  a `{value, coding|unit}` record (see `_clean_result_value` in
 *  `care/emr/resources/questionnaire/utils.py`). */
export type AnswerShape =
  "boolean" | "number" | "choice" | "choice_multi" | "text";

export type UnusableReason =
  "link_id" | "type" | "coded_multi" | "repeating_group";

export interface QuestionVariable {
  ref: string;
  question: Question;
  shape: AnswerShape;
  /** Present when the question cannot be referenced from a condition. */
  unusable?: UnusableReason;
}

/** A value the registry can resolve from the root — `patient.age`. */
export interface ContextValueVariable {
  ref: string;
  /** Path segments for display (`["patient", "age"]`). */
  segments: string[];
  /** The context type that owns the leaf (`Patient`). */
  ownerContextType: string;
}

/** A context an instruction can be applied to — `self` (the submission) or
 *  a typed neighbour reached through the field graph (`patient`). */
export interface ContextPathOption {
  path: string;
  contextType: string;
}

export const SELF_CONTEXT_PATH = "self";

/** The registry lists fields once per context map they sit in — the same
 *  (context, field) pair can come back twice. */
export function dedupeContextFields(
  fields: ActionContextField[],
): ActionContextField[] {
  const seen = new Set<string>();
  return fields.filter((field) => {
    const key = `${field.context_type}\u0000${field.field}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const MAX_CONTEXT_DEPTH = 3;

/**
 * Every typed context reachable from `rootType` by following edge fields
 * (`target_context_type`), root first. Bounded by depth and by not
 * re-entering a context type already on the path, so a cyclic registry
 * cannot loop. Dynamic fields are skipped: they resolve arbitrary names at
 * run time and describe nothing statically.
 */
export function reachableContextPaths(
  rootType: string,
  fields: ActionContextField[],
): ContextPathOption[] {
  const result: ContextPathOption[] = [
    { path: SELF_CONTEXT_PATH, contextType: rootType },
  ];
  const walk = (
    contextType: string,
    path: string,
    chain: ReadonlySet<string>,
    depth: number,
  ) => {
    if (depth >= MAX_CONTEXT_DEPTH) return;
    for (const field of fields) {
      if (
        field.context_type !== contextType ||
        field.evaluation === "dynamic" ||
        !field.target_context_type ||
        chain.has(field.target_context_type)
      ) {
        continue;
      }
      const childPath =
        path === SELF_CONTEXT_PATH ? field.field : `${path}.${field.field}`;
      result.push({ path: childPath, contextType: field.target_context_type });
      walk(
        field.target_context_type,
        childPath,
        new Set([...chain, field.target_context_type]),
        depth + 1,
      );
    }
  };
  walk(rootType, SELF_CONTEXT_PATH, new Set([rootType]), 0);
  return result;
}

/** Every leaf value reachable from the root — what a condition row's
 *  "field" picker offers beside the questionnaire's answers. */
export function reachableContextValues(
  rootType: string,
  fields: ActionContextField[],
): ContextValueVariable[] {
  const values: ContextValueVariable[] = [];
  for (const context of reachableContextPaths(rootType, fields)) {
    for (const field of fields) {
      if (
        field.context_type !== context.contextType ||
        field.evaluation === "dynamic" ||
        field.target_context_type
      ) {
        continue;
      }
      const segments =
        context.path === SELF_CONTEXT_PATH
          ? [field.field]
          : [...context.path.split("."), field.field];
      values.push({
        ref: segments.join("."),
        segments,
        ownerContextType: context.contextType,
      });
    }
  }
  return values;
}

const NUMBER_TYPES: QuestionType[] = ["integer", "decimal", "quantity"];

/** Types that never produce a `q_` value: layout types and structured
 *  questions, whose data goes to the domain APIs, not the response. */
const NON_ANSWER_TYPES: QuestionType[] = ["group", "display", "structured"];

/**
 * The ref a question's answer is compared through — what
 * `_clean_result_value` (backend `questionnaire/utils.py`) produces:
 * quantities are always `{value, coding, unit}` records (the fill inputs
 * attach a unit on every write); a valueset-backed choice is sent as
 * `{coding}` with NO value key, so it compares by code; option-backed
 * choices clean to the bare option string whatever `code` the option
 * carries; everything else is a scalar.
 */
function answerRef(question: Question): string {
  const base = questionRef(question.link_id);
  if (question.type === "quantity") return `${base}.value`;
  if (question.type === "choice" && question.answer_value_set) {
    return `${base}.coding.code`;
  }
  return base;
}

/** dateTime answers are ISO strings with an offset — never something an
 *  author can type an equal of. */
const TYPES_WITHOUT_COMPARISON: QuestionType[] = ["dateTime"];

export function answerShapeOf(question: Question): AnswerShape {
  if (question.type === "boolean") return "boolean";
  if (NUMBER_TYPES.includes(question.type)) return "number";
  if (question.type === "choice") {
    return question.repeats ? "choice_multi" : "choice";
  }
  return "text";
}

/**
 * The questionnaire's answers as condition variables, in tree order.
 * Groups, display blocks and structured questions never produce a `q_`
 * value; hyphenated link ids cannot be spelled as a Python name; and a
 * coded multi-select cleans to a list of records that `in` cannot search.
 * Those stay in the list, marked, so the picker can explain rather than
 * silently omit them.
 */
export function questionVariables(questions: Question[]): QuestionVariable[] {
  const variables: QuestionVariable[] = [];
  // `build_cleaned_response` flattens a plain group's children to top-level
  // names, but keys a REPEATING group under its own link_id as a list of
  // records — its descendants never exist as `q_` names.
  const walk = (list: Question[], insideRepeatingGroup: boolean) => {
    for (const question of list) {
      const shape = answerShapeOf(question);
      let unusable: UnusableReason | undefined;
      if (insideRepeatingGroup) {
        unusable = "repeating_group";
      } else if (
        NON_ANSWER_TYPES.includes(question.type) ||
        TYPES_WITHOUT_COMPARISON.includes(question.type)
      ) {
        unusable = "type";
      } else if (!isIdentifierSafeLinkId(question.link_id)) {
        unusable = "link_id";
      } else if (shape === "choice_multi" && question.answer_value_set) {
        unusable = "coded_multi";
      }
      variables.push({ ref: answerRef(question), question, shape, unusable });
      walk(
        question.questions ?? [],
        insideRepeatingGroup ||
          (question.type === "group" && !!question.repeats),
      );
    }
  };
  walk(questions, false);
  return variables;
}

/** The question a rule's ref points at, if any. */
export function questionOfRef(
  ref: string,
  variables: QuestionVariable[],
): QuestionVariable | undefined {
  const linkId = linkIdOfRef(ref);
  if (linkId === undefined) return undefined;
  return variables.find((variable) => variable.question.link_id === linkId);
}

const OPERATORS_BY_SHAPE: Record<AnswerShape, readonly ActionRuleOperator[]> = {
  boolean: ["==", "!="],
  number: ["==", "!=", ">", ">=", "<", "<="],
  choice: ["==", "!="],
  choice_multi: ["in", "not in"],
  text: ["==", "!="],
};

/** Context values carry no type in the registry — every comparison stays
 *  on offer and the value is typed by what the author enters. */
const CONTEXT_OPERATORS: readonly ActionRuleOperator[] = [
  "==",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
];

export function operatorsFor(
  shape: AnswerShape | undefined,
): readonly ActionRuleOperator[] {
  return shape ? OPERATORS_BY_SHAPE[shape] : CONTEXT_OPERATORS;
}
