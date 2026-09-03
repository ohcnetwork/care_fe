/**
 * Save-time rules for questionnaire actions — the counterpart of
 * `saveValidation.ts` for the question tree. Each rule names the first
 * action it fails on; the studio blocks Save until the list is empty.
 *
 * The backend only rejects an unknown instruction slug and missing
 * `condition`/`context` fields at save time; a bad expression, a missing
 * required param or a reference to a deleted or conditionally-shown
 * question would otherwise sail through the PUT and break every
 * SUBMISSION of the questionnaire instead.
 */
import {
  ActionInstructionDefinition,
  QuestionnaireAction,
} from "@/types/questionnaire/actions";
import { Question } from "@/types/questionnaire/question";

import {
  actionReferencedLinkIds,
  lintExpression,
  parseTemplate,
} from "@/components/QuestionnaireV2/shared/actionExpression";

export interface ActionIssue {
  /** Index into the questionnaire's `actions` array. */
  index: number;
  messageKey: string;
}

export interface ActionCheckContext {
  questions: Question[];
  /** Undefined until the registry has loaded — the slug rules stand down
   *  rather than flag every action as unknown while the request is in
   *  flight. */
  instructions?: ActionInstructionDefinition[];
}

interface TreeIndex {
  linkIds: Set<string>;
  /** link_ids of questions that are shown conditionally — themselves or
   *  through an enclosing group — and so can be absent from a submission
   *  however required they are. */
  conditional: Set<string>;
}

function indexTree(questions: Question[]): TreeIndex {
  const index: TreeIndex = { linkIds: new Set(), conditional: new Set() };
  const walk = (list: Question[], underCondition: boolean) => {
    for (const question of list) {
      const conditional =
        underCondition || (question.enable_when?.length ?? 0) > 0;
      index.linkIds.add(question.link_id);
      if (conditional) index.conditional.add(question.link_id);
      walk(question.questions ?? [], conditional);
    }
  };
  walk(questions, false);
  return index;
}

function isBlank(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value !== "string") return false;
  if (value.trim() === "") return true;
  const template = parseTemplate(value);
  return template?.kind === "expression" && template.expression === "";
}

/** Every expression an action evaluates: its condition and each templated
 *  param's inner expression. */
function expressionsOf(action: QuestionnaireAction): string[] {
  const expressions = [action.condition];
  for (const instruction of action.instructions) {
    for (const value of Object.values(instruction.params)) {
      const template = parseTemplate(value);
      if (template) {
        expressions.push(
          template.kind === "ref" ? template.ref : template.expression,
        );
      }
    }
  }
  return expressions;
}

interface ActionRule {
  predicate: (
    action: QuestionnaireAction,
    tree: TreeIndex,
    instructions: ActionInstructionDefinition[] | undefined,
  ) => boolean;
  messageKey: string;
}

const ACTION_RULES: ActionRule[] = [
  {
    predicate: (action) => action.condition.trim() === "",
    messageKey: "action_issue_condition_empty",
  },
  {
    predicate: (action) =>
      expressionsOf(action).some(
        (expression) => lintExpression(expression) === "attribute",
      ),
    messageKey: "action_issue_expression_attribute",
  },
  {
    predicate: (action) =>
      expressionsOf(action).some(
        (expression) =>
          expression.trim() !== "" && lintExpression(expression) === "syntax",
      ),
    messageKey: "action_issue_expression_syntax",
  },
  {
    predicate: (action) => action.instructions.length === 0,
    messageKey: "action_issue_no_instructions",
  },
  {
    predicate: (action) =>
      action.instructions.some((instruction) => !instruction.slug),
    messageKey: "action_issue_instruction_missing",
  },
  {
    predicate: (action, _tree, instructions) =>
      !!instructions &&
      action.instructions.some(
        (instruction) =>
          instruction.slug &&
          !instructions.some(
            (definition) => definition.slug === instruction.slug,
          ),
      ),
    messageKey: "action_issue_instruction_unknown",
  },
  {
    predicate: (action) =>
      action.instructions.some((instruction) => !instruction.context),
    messageKey: "action_issue_context_missing",
  },
  {
    predicate: (action, _tree, instructions) =>
      !!instructions &&
      action.instructions.some((instruction) => {
        const definition = instructions.find(
          (candidate) => candidate.slug === instruction.slug,
        );
        return (definition?.input_schema.required ?? []).some((name) =>
          isBlank(instruction.params[name]),
        );
      }),
    messageKey: "action_issue_param_required",
  },
  {
    predicate: (action, { linkIds }) =>
      actionReferencedLinkIds(action).some((linkId) => !linkIds.has(linkId)),
    messageKey: "action_issue_unknown_question",
  },
  {
    predicate: (action, { conditional }) =>
      actionReferencedLinkIds(action).some((linkId) => conditional.has(linkId)),
    messageKey: "action_issue_conditional_question",
  },
];

/** The first failing rule per action, in action order. */
export function findActionIssues(
  actions: QuestionnaireAction[],
  { questions, instructions }: ActionCheckContext,
): ActionIssue[] {
  const tree = indexTree(questions);
  const issues: ActionIssue[] = [];
  actions.forEach((action, index) => {
    const failing = ACTION_RULES.find((rule) =>
      rule.predicate(action, tree, instructions),
    );
    if (failing) issues.push({ index, messageKey: failing.messageKey });
  });
  return issues;
}
