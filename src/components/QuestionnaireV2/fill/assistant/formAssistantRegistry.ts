import type { ComponentType } from "react";

import type { FillAssistantHandle } from "./types";

/**
 * The `formAssistant` manifest extension point's registry — registered
 * "the same way `structuredQuestionTypes` is"
 * (`structured/pluginRegistry.ts`): a module-level Map, a version counter
 * plus a listener Set so a React view can `useSyncExternalStore` on it,
 * and a per-registration cleanup closure that only removes the entry it
 * installed (a re-register of the same slug wins, and the superseded
 * cleanup becomes a no-op).
 *
 * Keyed directly by the plugin's slug — unlike `structuredQuestionTypes`
 * (namespaced `{plugin_slug}.{type_name}`, since one plugin can register
 * several types), a plugin contributes at most ONE form assistant, so the
 * slug alone is already the natural, unique key.
 *
 * `PluginEngine.tsx` is the only writer, and it MUST pass the trusted,
 * backend-issued `config.slug` — never `plugin.plugin` (the manifest's own
 * self-declared display name, which an untrusted remote controls). This
 * mirrors `registerPluginStructuredType`'s `ownerSlug` check, minus the
 * namespace-parsing half: there is no separate "type name" to validate
 * against an owner here, since the registry key IS the owner.
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
  const stored = definition;
  formAssistants.set(ownerSlug, stored);
  notify();
  return () => {
    if (formAssistants.get(ownerSlug) === stored) {
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
