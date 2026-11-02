import type { evaluate as fhirpathEvaluate } from "fhirpath";

/**
 * Context passed to computed field FHIRPath expressions.
 * Contains the parent entity and related data for computation.
 */
export interface ComputedFieldContext {
  [key: string]: unknown;
}

// fhirpath pulls in UCUM and ANTLR (~550 KB minified), so it is loaded on
// demand, only when a schema actually has computed fields.
let evaluate: typeof fhirpathEvaluate | undefined;
let loading: Promise<void> | undefined;

/**
 * Loads the FHIRPath evaluator. Safe to call repeatedly; a failed load is
 * retried on the next call.
 */
export function loadComputedFieldEvaluator(): Promise<void> {
  loading ??= import("fhirpath").then(
    (fhirpath) => {
      evaluate = fhirpath.evaluate;
    },
    (error) => {
      loading = undefined;
      throw error;
    },
  );
  return loading;
}

/** Whether `evaluateComputedField` can run synchronously. */
export function isComputedFieldEvaluatorLoaded(): boolean {
  return evaluate !== undefined;
}

/**
 * Evaluates a FHIRPath expression against a context object for computed extension fields.
 * Requires `loadComputedFieldEvaluator()` to have resolved; throws otherwise.
 *
 * @param context - The data context (e.g., { supply_deliveries: [...], delivery_order: {...} })
 * @param expression - A FHIRPath expression string
 * @returns The first result of the evaluation, or undefined if empty
 */
export function evaluateComputedField(
  context: ComputedFieldContext,
  expression: string,
): unknown {
  if (!evaluate) {
    throw new Error("FHIRPath evaluator is not loaded");
  }
  const result = evaluate(context, expression) as unknown[];
  return result.length > 0 ? result[0] : undefined;
}
