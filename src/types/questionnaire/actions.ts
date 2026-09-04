import { SubjectType } from "./questionnaire";

/**
 * Questionnaire actions — server-side automations evaluated when a
 * patient/encounter questionnaire is submitted (`POST …/submit/`). The
 * backend (care `action_evaluator`) runs each action's `condition` over the
 * cleaned answers (`q_<link_id>`) and the context graph (`patient["age"]`),
 * then executes its instructions in order.
 *
 * Wire shape — `care/action_evaluator/base.py` `Action`/`Instruction`:
 * `condition` is a Python-subset expression string (`evalidate`), REQUIRED
 * (an empty string never fires — "always" is the literal `True`);
 * `instructions[].context` is a context PATH from the submission root
 * (`self`, `patient`, …), REQUIRED; `slug` must name a registered
 * instruction (save fails with 400 otherwise).
 */
export interface QuestionnaireActionInstruction {
  slug: string;
  /** Instruction inputs per its `input_schema`. A string value wrapped
   *  entirely in `{{ … }}` is evaluated as an expression at run time. */
  params: Record<string, unknown>;
  context: string;
}

export interface QuestionnaireAction {
  condition: string;
  instructions: QuestionnaireActionInstruction[];
}

/** `care/action_evaluator/instruction_engine/base.py` `InstructionType`. */
export const ACTION_INSTRUCTION_TYPES = [
  "REDIRECT",
  "PERFORMED",
  "NOTIFY",
  "TEXT",
  "VALIDATE",
] as const;

export type ActionInstructionType = (typeof ACTION_INSTRUCTION_TYPES)[number];

/** The subset of JSON Schema pydantic emits for an instruction's input
 *  model that the param editor understands; anything richer falls back to
 *  the JSON textarea. */
export interface ActionParamSchema {
  type?: string | string[];
  title?: string;
  description?: string;
  enum?: unknown[];
  default?: unknown;
  /** Pydantic renders `str | None` as `anyOf: [{type: string}, {type: null}]`. */
  anyOf?: ActionParamSchema[];
  /** Pydantic renders an Enum field as `$ref: "#/$defs/<Name>"`. */
  $ref?: string;
  /** Backend hints (`json_schema_extra`) for a richer control than the
   *  JSON type suggests — `tag_config` renders a tag picker scoped to
   *  `x-care-resource`. */
  "x-care-picker"?: string;
  "x-care-resource"?: string;
}

export interface ActionInputSchema {
  type?: string;
  title?: string;
  properties?: Record<string, ActionParamSchema>;
  required?: string[];
  $defs?: Record<string, ActionParamSchema>;
}

/** `GET /api/v1/action_configuration/instructions/` entry —
 *  `BaseInstruction.render_dict`. */
export interface ActionInstructionDefinition {
  slug: string;
  input_schema: ActionInputSchema;
  output_schema: unknown;
  /** The context TYPE the instruction declares (informational — the
   *  backend does not enforce it against the resolved `context` path). */
  context: string;
  instruction_type: ActionInstructionType | (string & {});
}

/** `GET /api/v1/action_configuration/fields/` entry —
 *  `ActionContextFieldBase.render_dict`. A field with `target_context_type`
 *  is an edge to another context (`patient` → `Patient`); without it the
 *  field is a leaf value (`age`). */
export interface ActionContextField {
  context_type: string;
  field: string;
  evaluation: "static" | "global" | "dynamic";
  target_context_type?: string;
}

/** One entry of a write response's `_actions` — `do_evaluate` output. Every
 *  viewset that evaluates actions attaches the list (questionnaire submit,
 *  appointment creation; batch sub-results carry it on `data`); see
 *  `Utils/actions/actionOutcomes.ts` for how it is read. */
export interface ActionOutcome {
  slug: string;
  instruction_type: ActionInstructionType | (string & {});
  results: unknown;
}

/**
 * The context type the backend evaluates a questionnaire's actions under
 * (`QuestionnaireViewSet.submit`): encounter questionnaires run as
 * `EncounterQuestionnaire`, patient ones as `PatientQuestionnaire`. The
 * resource submit path (location/device/facility) never evaluates actions,
 * so those subject types have no context — the studio hides authoring for
 * them.
 */
export function actionContextTypeFor(
  subjectType: SubjectType,
): "EncounterQuestionnaire" | "PatientQuestionnaire" | null {
  switch (subjectType) {
    case "encounter":
      return "EncounterQuestionnaire";
    case "patient":
      return "PatientQuestionnaire";
    default:
      return null;
  }
}

/**
 * The wire shape, tolerated: `instructions` defaults to `[]` server-side
 * and another client may omit it; `params`/`context` are required by the
 * backend but read here defensively so a hand-edited questionnaire cannot
 * crash the studio. Also the shape every PUT body sends back.
 */
export function normalizeQuestionnaireActions(
  raw: unknown,
): QuestionnaireAction[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((entry): QuestionnaireAction[] => {
    if (typeof entry !== "object" || entry === null) return [];
    const action = entry as Partial<QuestionnaireAction>;
    const instructions = Array.isArray(action.instructions)
      ? action.instructions
      : [];
    return [
      {
        ...action,
        condition: typeof action.condition === "string" ? action.condition : "",
        instructions: instructions.map((instruction) => ({
          ...instruction,
          slug: typeof instruction.slug === "string" ? instruction.slug : "",
          params:
            typeof instruction.params === "object" &&
            instruction.params !== null
              ? instruction.params
              : {},
          context:
            typeof instruction.context === "string" && instruction.context
              ? instruction.context
              : "self",
        })),
      },
    ];
  });
}
