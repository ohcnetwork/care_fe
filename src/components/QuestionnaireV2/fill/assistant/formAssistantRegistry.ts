import type { ComponentType } from "react";

import type { FillAssistantHandle } from "./types";

/**
 * Registry for the `formAssistant` manifest extension point. A plugin has at
 * most one assistant, keyed by its trusted backend-issued slug; re-registering
 * the same slug replaces the prior definition and makes its cleanup a no-op.
 */
export interface FormAssistantDefinition {
  component: ComponentType<{ handle: FillAssistantHandle }>;
  /** Display label, for a host UI that needs to distinguish more than one
   *  mounted assistant. Plugins own their own i18n (same rule
   *  `PluginStructuredTypeDefinitionBase.label` documents). */
  label?: string;
}

export interface RegisteredFormAssistant extends FormAssistantDefinition {
  /** The trusted, backend-issued plugin slug this assistant is registered
   *  under — never the manifest's own `plugin` field. */
  slug: string;
}

const formAssistants = new Map<string, FormAssistantDefinition>();
let version = 0;
const listeners = new Set<() => void>();

function notify() {
  version += 1;
  listeners.forEach((listener) => listener());
}

/** Register a plugin's form assistant; returns its cleanup closure.
 *  `ownerSlug` MUST be the trusted `config.slug` PluginEngine's own
 *  combine step produces (spread in last, after the manifest's own
 *  fields — see `PluginEngine.tsx`'s `pluginsQuery` `combine`), never a
 *  manifest-declared name. */
export function registerFormAssistant(
  definition: FormAssistantDefinition,
  ownerSlug: string,
): () => void {
  formAssistants.set(ownerSlug, definition);
  notify();
  return () => {
    if (formAssistants.get(ownerSlug) === definition) {
      formAssistants.delete(ownerSlug);
      notify();
    }
  };
}

export function listFormAssistants(): RegisteredFormAssistant[] {
  return Array.from(formAssistants.entries()).map(([slug, definition]) => ({
    slug,
    ...definition,
  }));
}

export function subscribeToFormAssistants(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Monotonic counter — the `useSyncExternalStore` snapshot, so a view
 *  listing registered assistants re-renders when the set changes (a
 *  late-loading plugin's assistant appears with no reload). */
export function getFormAssistantsVersion(): number {
  return version;
}
