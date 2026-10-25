import {
  ContextPathOption,
  SELF_CONTEXT_PATH,
} from "@/components/QuestionnaireV2/builder/actionVariables";
import {
  ActionInstructionDefinition,
  QuestionnaireActionInstruction,
} from "@/types/questionnaire/actions";

/** The params a freshly picked instruction starts with — schema defaults
 *  only, so a required param without one stays blank and the save rule
 *  flags it. */
export function defaultParams(
  definition: ActionInstructionDefinition,
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(definition.input_schema.properties ?? {})
      .filter(([, schema]) => schema.default !== undefined)
      .map(([name, schema]) => [name, schema.default]),
  );
}

/**
 * The context path an instruction is applied to: the one reachable path
 * whose type matches its declared context, else the submission itself.
 * Not an author choice — nothing on the backend distinguishes the two
 * today, so there is no control for it, only a line saying what resolved.
 */
export function defaultContextPath(
  definition: ActionInstructionDefinition | undefined,
  contextPaths: ContextPathOption[],
): string {
  const matches = definition
    ? contextPaths.filter((option) => option.contextType === definition.context)
    : [];
  return matches.length === 1 ? matches[0].path : SELF_CONTEXT_PATH;
}

/** A fresh instruction for `definition`, params at their defaults. */
export function newInstruction(
  definition: ActionInstructionDefinition,
  contextPaths: ContextPathOption[],
): QuestionnaireActionInstruction {
  return {
    slug: definition.slug,
    params: defaultParams(definition),
    context: defaultContextPath(definition, contextPaths),
  };
}
