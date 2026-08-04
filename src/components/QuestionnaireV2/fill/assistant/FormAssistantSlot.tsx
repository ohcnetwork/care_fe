import { useSyncExternalStore } from "react";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";

import {
  getFormAssistantsVersion,
  listFormAssistants,
  subscribeToFormAssistants,
} from "./formAssistantRegistry";
import type { FillAssistantHandle } from "./types";

/**
 * Renders every currently registered `formAssistant` plugin (Scribe
 * first), handing each the session's handle. Replaces
 * `<PLUGIN_Component __name="Scribe" actions={descriptors} invoke={invoke} />`
 * in `QuestionnaireFillPage.tsx` — `formAssistant` is registered through
 * its own dedicated registry (`formAssistantRegistry.ts`, "the same way
 * `structuredQuestionTypes` is"), not through `SupportedPluginComponents`/
 * `PLUGIN_Component`, so this reads that registry directly instead.
 *
 * Each assistant is wrapped in its own `PluginErrorBoundary` keyed by its
 * TRUSTED registration slug — the same one `PluginEngine.tsx` passed to
 * `registerFormAssistant` (`config.slug`, never `plugin.plugin`) — so one
 * broken plugin's assistant cannot take the fill canvas down with it, and
 * cannot masquerade under another plugin's identity in the error log.
 */
export function FormAssistantSlot({ handle }: { handle: FillAssistantHandle }) {
  useSyncExternalStore(
    subscribeToFormAssistants,
    getFormAssistantsVersion,
    getFormAssistantsVersion,
  );
  const assistants = listFormAssistants();
  if (assistants.length === 0) return null;
  return (
    <>
      {assistants.map(({ slug, component: Assistant }) => (
        <PluginErrorBoundary key={slug} pluginName={slug}>
          <Assistant handle={handle} />
        </PluginErrorBoundary>
      ))}
    </>
  );
}
