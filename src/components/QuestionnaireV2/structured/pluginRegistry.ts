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
 * Federation plugin contribution for a structured question type. Plugin row
 * shapes are opaque to the host, so the plugin's own component, validation and
 * request builder are the only code that interprets them. Plugins own i18n:
 * `label` is a plain display string from the manifest.
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
 *  Namespacing prevents collisions with core and other plugin types, so the
 *  namespace must match the plugin slug that owns the registration. */
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
