import { usePath } from "raviger";
import React, { useMemo, useSyncExternalStore } from "react";

import { OverrideContext, ResolutionContext, StackContext } from "./contexts";
import {
  computeResolutionMap,
  getRegistryVersion,
  subscribeToRegistry,
} from "./registry";
import type { OverrideContextType, OverrideProviderProps } from "./types";

/**
 * OverrideProvider - Provides global context for the override system
 *
 * This component should be placed near the root of the app, wrapping
 * components that may be overridden.
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <OverrideProvider context={{ userRole: currentUser?.role }}>
 *       <AppRoutes />
 *     </OverrideProvider>
 *   );
 * }
 * ```
 */
export function OverrideProvider({
  children,
  context: externalContext = {},
}: OverrideProviderProps) {
  // Get current route/page info
  const path = usePath() ?? "/";
  const registryVersion = useSyncExternalStore(
    subscribeToRegistry,
    getRegistryVersion,
    getRegistryVersion,
  );

  // Build the full override context
  const overrideContext = useMemo<OverrideContextType>(() => {
    return {
      route: path,
      page: extractPageFromRoute(path),
      ...externalContext,
    };
  }, [path, externalContext]);

  // Compute the resolution map (memoized)
  const resolutionMap = useMemo(() => {
    return computeResolutionMap(overrideContext);
  }, [overrideContext, registryVersion]);

  return (
    <OverrideContext.Provider value={overrideContext}>
      <ResolutionContext.Provider value={resolutionMap}>
        <StackContext.Provider value={null}>{children}</StackContext.Provider>
      </ResolutionContext.Provider>
    </OverrideContext.Provider>
  );
}

/**
 * Extract a page identifier from a route path
 *
 * This is a simple implementation that extracts the first path segment.
 * Can be customized based on your routing structure.
 */
function extractPageFromRoute(route: string): string {
  // Remove leading slash and get first segment
  const segments = route.split("/").filter(Boolean);

  if (segments.length === 0) return "home";

  // Handle common patterns
  const firstSegment = segments[0];

  // You can add more sophisticated logic here
  // For example: /facility/:id/patients -> "facility-patients"
  if (segments.length >= 2 && segments[1] !== undefined) {
    // Check if second segment is an ID (UUID-like or numeric)
    const isId = /^[0-9a-f-]+$/i.test(segments[1]);
    if (isId && segments[2]) {
      return `${firstSegment}-${segments[2]}`;
    }
  }

  return firstSegment;
}

/**
 * Hook to dynamically update the override context
 *
 * Useful for setting context values that change during runtime
 * (e.g., after user login, when entering a facility)
 */
export function useOverrideContextUpdater() {
  const context = React.useContext(OverrideContext);
  return context;
}

export default OverrideProvider;
