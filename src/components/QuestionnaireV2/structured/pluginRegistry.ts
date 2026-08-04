import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { SubjectType } from "@/types/questionnaire/questionnaire";
import {
  PLUGIN_STRUCTURED_TYPE_PATTERN,
  type StructuredEditRecord,
} from "@/types/questionnaire/structured";

import type {
  StructuredBatchEntry,
  StructuredContextKey,
  StructuredDraftPolicy,
  StructuredInputProps,
  StructuredRequestContext,
} from "./types";

/**
 * What a federation plugin contributes to make a structured question type
 * of its own. The same contract as a core `StructuredTypeDefinition`
 * (`./types.ts`), minus the compile-time key correlation core enjoys: a
 * plugin's data shape is opaque to the host, so its entries arrive as
 * `unknown[]`/`StructuredEditRecord[]` and the plugin's own
 * component/validate/toRequests are the only code that reads them.
 *
 * `contract: 2` is REQUIRED, matching core: this extension point predates
 * the legacy-contract removal, but no federation remote has shipped yet
 * (`src/pluginTypes.ts`'s `structuredQuestionTypes` is a Phase 1-4
 * addition), so there is no already-published manifest to stay
 * backward-compatible with. See `StructuredTypeDefinition`'s doc comment
 * for why the field survives as a version tag rather than a discriminant.
 *
 * Plugins own their i18n — `label` is a plain display string from the
 * manifest, never an i18n key the host resolves.
 */
export interface PluginStructuredTypeDefinition {
  /** Namespaced `{plugin_slug}.{type_name}` — bare names are reserved for core. */
  type: string;
  component: ComponentType<StructuredInputProps>;
  requires: readonly StructuredContextKey[];
  /** Questionnaire subject types this type may be authored onto — same
   *  gate core types declare (picker, fill renderer, compose, validate). */
  subjects: readonly SubjectType[];
  draftPolicy: StructuredDraftPolicy;
  /** Display label (plugins own their i18n; plain string fallback). */
  label: string;
  icon?: ComponentType<{ className?: string }>;
  contract: 2;
  validate?: (
    projection: readonly unknown[],
    edits: readonly StructuredEditRecord[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  toRequests: (
    edits: readonly StructuredEditRecord[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}

/**
 * Module-level store — same mechanics as `lib/override/registry.ts`: a Map
 * keyed by type, a version counter and a listener set so React views can
 * `useSyncExternalStore` on it, and a cleanup closure per registration that
 * only removes the entry it installed (a re-register of the same type wins,
 * and the stale cleanup becomes a no-op).
 */
const pluginTypes = new Map<string, PluginStructuredTypeDefinition>();
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** Registration by a plugin that does not own the namespace is refused,
 *  not thrown: one plugin listing a stray id must not stop the rest of its
 *  definitions (or anyone else's) from registering. */
const noopCleanup = () => {};

/** Register a plugin structured type; returns its cleanup closure.
 *  Throws on a non-namespaced id — PluginEngine catches and logs, so one
 *  bad definition never takes the app down.
 *
 *  Namespacing is the whole isolation story: `{plugin_slug}.{type_name}`
 *  can collide with neither a core type (those are bare) nor another
 *  plugin's — which holds only if the slug half is VERIFIED, so
 *  `ownerSlug` is checked against it here. Without that check, plugin B
 *  listing `plugin_a.assessment` (a copied sample, or malice) would take
 *  over questionnaires authored against plugin A's type depending on
 *  manifest load order, with no user-visible signal.
 *
 *  Every registration reaches the batch and its own validation — a
 *  registered type's `toRequests`/`validate` genuinely runs
 *  (`fill/submit/composeStructured.ts`'s `composeStructuredV2Requests`,
 *  `fill/submit/validateStructured.ts`); see
 *  `fill/submit/composeStructured.test.ts`'s end-to-end regression test. */
export function registerPluginStructuredType(
  definition: PluginStructuredTypeDefinition,
  ownerSlug: string,
): () => void {
  if (!PLUGIN_STRUCTURED_TYPE_PATTERN.test(definition.type)) {
    throw new Error(
      `Plugin structured type "${definition.type}" must be namespaced "{plugin_slug}.{type_name}"`,
    );
  }
  const namespace = definition.type.slice(0, definition.type.indexOf("."));
  if (namespace !== ownerSlug) {
    console.error(
      `Plugin "${ownerSlug}" tried to register structured type "${definition.type}", which belongs to the "${namespace}" namespace; skipping it`,
    );
    return noopCleanup;
  }
  if (pluginTypes.has(definition.type)) {
    // Last-wins (the effect re-registers on every manifest change), but a
    // genuine duplicate — two plugins claiming one id, or one plugin
    // listing it twice — would otherwise be invisible.
    console.warn(
      `Structured type "${definition.type}" is already registered; the new definition replaces it`,
    );
  }
  pluginTypes.set(definition.type, definition);
  notify();
  return () => {
    if (pluginTypes.get(definition.type) === definition) {
      pluginTypes.delete(definition.type);
      notify();
    }
  };
}

export function getPluginStructuredType(
  type: string,
): PluginStructuredTypeDefinition | undefined {
  return pluginTypes.get(type);
}

export function listPluginStructuredTypes(): PluginStructuredTypeDefinition[] {
  return Array.from(pluginTypes.values());
}

export function subscribeToStructuredTypes(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Monotonic counter — the `useSyncExternalStore` snapshot. Views that read
 *  the registry re-render when it changes, so a late-loading plugin's type
 *  appears without a reload. */
export function getStructuredTypesVersion(): number {
  return version;
}
