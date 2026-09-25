import type { ContextPathOption } from "@/components/QuestionnaireV2/builder/actionVariables";
import type { ActionInstructionDefinition } from "@/types/questionnaire/actions";

/** These instructions only read their parameters; their registry context
 * predates use from other triggers and does not restrict execution. */
const CONTEXT_INDEPENDENT_INSTRUCTIONS = new Set(["show_message", "logging"]);

export function isInstructionCompatible(
  instruction: ActionInstructionDefinition,
  contextPaths: ContextPathOption[],
): boolean {
  return (
    CONTEXT_INDEPENDENT_INSTRUCTIONS.has(instruction.slug) ||
    contextPaths.some((option) => option.contextType === instruction.context)
  );
}
