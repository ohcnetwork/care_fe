import { useSyncExternalStore } from "react";

import { PluginErrorBoundary } from "@/components/Common/PluginErrorBoundary";

import {
  getFormAssistantsVersion,
  listFormAssistants,
  subscribeToFormAssistants,
} from "./formAssistantRegistry";
import type { FillAssistantHandle } from "./types";

/**
 * Renders registered `formAssistant` plugins with the session handle. Each
 * assistant is isolated in its own error boundary keyed by the trusted
 * backend-issued plugin slug.
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
