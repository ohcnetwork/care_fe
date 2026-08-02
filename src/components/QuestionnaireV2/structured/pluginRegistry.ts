import type { ComponentType } from "react";

import type { QuestionValidationError } from "@/types/questionnaire/batch";
import type { SubjectType } from "@/types/questionnaire/questionnaire";

import type {
  StructuredBatchEntry,
  StructuredContextKey,
  StructuredInputProps,
  StructuredRequestContext,
} from "./types";

/**
 * What a federation plugin contributes to make a structured question type
 * of its own. The same contract as a core `StructuredTypeDefinition`, minus
 * the compile-time key correlation core enjoys: a plugin's data shape is
 * opaque to the host, so its entries arrive as `unknown[]` and the plugin's
 * own component/validate/buildRequests are the only code that reads them.
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
  draftPolicy: "serialize" | "exclude";
  /** Display label (plugins own their i18n; plain string fallback). */
  label: string;
  icon?: ComponentType<{ className?: string }>;
  validate?: (
    data: unknown[],
    questionId: string,
    required: boolean,
  ) => QuestionValidationError[];
  buildRequests: (
    data: unknown[],
    context: StructuredRequestContext,
  ) => Promise<StructuredBatchEntry[]>;
}

/**
 * Namespacing is the whole isolation story: a plugin type is always
 * `{plugin_slug}.{type_name}`, so it can never collide with a core type
 * (which are bare) nor with another plugin's.
 */
const PLUGIN_TYPE_PATTERN = /^[a-z0-9_]+\.[a-z0-9_]+$/;

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

/** Register a plugin structured type; returns its cleanup closure.
 *  Throws on a non-namespaced id — PluginEngine catches and logs, so one
 *  bad definition never takes the app down. */
export function registerPluginStructuredType(
  definition: PluginStructuredTypeDefinition,
): () => void {
  if (!PLUGIN_TYPE_PATTERN.test(definition.type)) {
    throw new Error(
      `Plugin structured type "${definition.type}" must be namespaced "{plugin_slug}.{type_name}"`,
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
