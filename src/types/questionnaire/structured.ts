/**
 * Canonical list of structured question types — the single runtime source
 * the `StructuredQuestionType` union derives from. Lives in the types layer
 * so `src/types/*` never imports from the components tree (the legacy
 * arrangement derived this union from
 * `components/Questionnaire/data/StructuredFormData`, inverting the layer
 * dependency).
 *
 * Adding a type here is step one of the checklist in
 * `src/components/QuestionnaireV2/structured/` — the total registry there
 * refuses to compile until the new member has a definition.
 */
export const STRUCTURED_QUESTION_TYPES = [
  "allergy_intolerance",
  "medication_request",
  "medication_statement",
  "symptom",
  "diagnosis",
  "encounter",
  "time_of_death",
  "files",
  "service_request",
  "charge_item",
  "appointment",
] as const;

export type StructuredQuestionType = (typeof STRUCTURED_QUESTION_TYPES)[number];

/**
 * A structured type contributed at runtime by a federation plugin. Always
 * namespaced `{plugin_slug}.{type_name}` — bare names stay reserved for
 * core, so a plugin can never shadow a built-in type. Enforced at
 * registration (`structured/pluginRegistry.ts`); the template literal here
 * only documents the shape to the type system.
 */
export type PluginStructuredTypeName = `${string}.${string}`;

/**
 * What a `structured_type` field may hold: a core type or a plugin one.
 * Keeping the core union as a member means a `switch`/`===` on a core
 * literal still narrows — the template-literal member never swallows it.
 */
export type StructuredTypeValue =
  StructuredQuestionType | PluginStructuredTypeName;

/** Narrows a `structured_type` back to a core member — the guard anything
 *  keyed on the closed core union (a total `Record`, a core-only handler
 *  map) needs now that the field also admits plugin ids. */
export function isCoreStructuredType(
  value: string,
): value is StructuredQuestionType {
  return (STRUCTURED_QUESTION_TYPES as readonly string[]).includes(value);
}
