import type { ComponentType } from "react";
import { createContext, useContext } from "react";

import type {
  OverrideContextType,
  RenderStackNode,
  ResolutionMap,
} from "./types";

/**
 * Override Contexts
 *
 * These contexts provide the global state for the override system.
 */

/**
 * Global override context - provides page, role, facility info
 */
export const OverrideContext = createContext<OverrideContextType>({});

/**
 * Resolution map context - precomputed component lookups (fast path)
 */
export const ResolutionContext = createContext<ResolutionMap>(new Map());

/**
 * Render stack context - tracks component ancestry (linked list)
 */
export const StackContext = createContext<RenderStackNode | null>(null);

/**
 * Hook to access the current override context
 */
export function useOverrideContext(): OverrideContextType {
  return useContext(OverrideContext);
}

/**
 * Hook to access the resolution map
 */
export function useResolutionMap(): ResolutionMap {
  return useContext(ResolutionContext);
}

/**
 * Hook to access the current render stack
 */
export function useRenderStack(): RenderStackNode | null {
  return useContext(StackContext);
}

/**
 * Hook to get the resolved component for a given key
 */
export function useResolvedComponent<P = Record<string, unknown>>(
  key: string,
  fallback: ComponentType<P>,
): ComponentType<P> {
  const resolutionMap = useResolutionMap();
  return (resolutionMap.get(key) as ComponentType<P>) || fallback;
}

/**
 * Convert the render stack to an array of component names (for debugging/matching)
 */
export function stackToArray(stack: RenderStackNode | null): string[] {
  const result: string[] = [];
  let current = stack;
  while (current) {
    result.unshift(current.value.name);
    current = current.parent;
  }
  return result;
}
