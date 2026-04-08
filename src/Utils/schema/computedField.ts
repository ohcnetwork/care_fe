import { evaluate } from "fhirpath";

/**
 * Context passed to computed field FHIRPath expressions.
 * Contains the parent entity and related data for computation.
 */
export interface ComputedFieldContext {
  [key: string]: unknown;
}

/**
 * Evaluates a FHIRPath expression against a context object for computed extension fields.
 *
 * @param context - The data context (e.g., { supply_deliveries: [...], delivery_order: {...} })
 * @param expression - A FHIRPath expression string
 * @returns The first result of the evaluation, or undefined if empty
 */
export function evaluateComputedField(
  context: ComputedFieldContext,
  expression: string,
): unknown {
  const result = evaluate(context, expression) as unknown[];
  return result.length > 0 ? result[0] : undefined;
}
