import type { z } from "zod";

/**
 * Where an action applies. A definition declares the record it belongs to;
 * a caller declares the record it is currently looking at. Only the keys a
 * definition actually sets are constrained — an action registered with
 * `{ patientId }` alone is reachable from that patient's encounters too,
 * while an encounter-scoped one is not reachable from the patient page.
 *
 * This is the boundary that keeps a federated agent from reaching state it
 * has no business in: the host never hands a plugin an action id it may
 * not call, and `invokeAction` re-checks the scope on the way in.
 */
export interface ActionScope {
  patientId?: string;
  encounterId?: string;
}

/**
 * One parameter, described for a language model. Hand-authored rather than
 * derived from the zod schema: the description is the part an LLM actually
 * plans against, and a JSON-Schema dump of the validator carries none of
 * it. The schema stays the enforcement; this is the documentation.
 */
export interface ActionParameterDescriptor {
  type: string;
  description: string;
  required?: boolean;
}

/** The public face of an action — everything a plugin is allowed to see.
 *  Deliberately free of `run`/`schema`/`scope`: a plugin describes and
 *  invokes, the host validates and executes. */
export interface ActionDescriptor {
  id: string;
  description: string;
  parameters: Record<string, ActionParameterDescriptor>;
}

export type ActionRunResult =
  { ok: true; data?: unknown } | { ok: false; error: string };

/** A registered action: its descriptor, the validator its input must pass,
 *  the scope it belongs to, and the host-side effect itself. */
export interface ActionDefinition<TInput = unknown> extends ActionDescriptor {
  schema: z.ZodType<TInput>;
  scope: ActionScope;
  run: (input: TInput) => ActionRunResult | Promise<ActionRunResult>;
}
