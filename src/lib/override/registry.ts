import type { ComponentType } from "react";

import type {
  AnyProps,
  Override,
  OverrideCondition,
  OverrideContextType,
  Registry,
  RegistryEntry,
  RenderStackNode,
  ResolutionMap,
} from "./types";

/**
 * Global Component Registry
 *
 * This is the central store for all registered components and their overrides.
 */
export const registry: Registry = new Map();
let registryVersion = 0;
const registryListeners = new Set<() => void>();

function notifyRegistryChange() {
  registryVersion += 1;
  registryListeners.forEach((listener) => listener());
}

export function subscribeToRegistry(listener: () => void) {
  registryListeners.add(listener);

  return () => {
    registryListeners.delete(listener);
  };
}

export function getRegistryVersion() {
  return registryVersion;
}

/**
 * Check if a condition has stack-based matching
 */
function hasStackCondition(condition?: OverrideCondition): boolean {
  return !!(condition?.stackPath && condition.stackPath.length > 0);
}

/**
 * Register a component in the registry
 */
export function registerComponent<P = AnyProps>(
  key: string,
  component: ComponentType<P>,
): void {
  const existing = registry.get(key);
  if (existing) {
    // Update the base component if already registered
    existing.base = component as ComponentType;
  } else {
    registry.set(key, {
      base: component as ComponentType,
      overrides: [],
      hasStackConditions: false,
    });
  }

  notifyRegistryChange();
}

/**
 * Add an override for a component
 */
export function addOverride<P = AnyProps>(
  key: string,
  override: Override<P>,
): () => void {
  let entry = registry.get(key);

  if (!entry) {
    // Create a placeholder entry - base will be set when component is registered
    entry = {
      base: (() => null) as ComponentType,
      overrides: [],
      hasStackConditions: false,
    };
    registry.set(key, entry);
  }

  entry.overrides.push(override as Override);

  // Update the hasStackConditions flag
  if (hasStackCondition(override.condition)) {
    entry.hasStackConditions = true;
  }

  // Sort overrides by priority (higher first)
  entry.overrides.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

  notifyRegistryChange();

  // Return cleanup function
  return () => {
    const currentEntry = registry.get(key);
    if (currentEntry) {
      currentEntry.overrides = currentEntry.overrides.filter(
        (o) => o !== override,
      );
      // Recalculate hasStackConditions
      currentEntry.hasStackConditions = currentEntry.overrides.some((o) =>
        hasStackCondition(o.condition),
      );
      notifyRegistryChange();
    }
  };
}

/**
 * Get a registry entry
 */
export function getEntry(key: string): RegistryEntry | undefined {
  return registry.get(key);
}

/**
 * Match a value against a condition (string or array of strings)
 */
function matchValue(
  value: string | undefined,
  condition: string | string[] | undefined,
): boolean {
  if (!condition) return true;
  if (!value) return false;

  if (Array.isArray(condition)) {
    return condition.includes(value);
  }
  return value === condition;
}

/**
 * Check if a condition matches the current context (without stack)
 */
export function matchCondition(
  condition: OverrideCondition | undefined,
  context: OverrideContextType,
): boolean {
  if (!condition) return true;

  // Check page match
  if (!matchValue(context.page, condition.page)) return false;

  // Check role match
  if (!matchValue(context.userRole, condition.userRole)) return false;

  // Check facility type match
  if (!matchValue(context.facilityType, condition.facilityType)) return false;

  // Check custom matcher
  if (condition.custom && !condition.custom(context)) return false;

  return true;
}

/**
 * Check if the render stack matches a stack path condition
 */
export function matchStackPath(
  stack: RenderStackNode | null,
  stackPath: string[],
): boolean {
  if (!stackPath.length) return true;

  // Convert stack to array for matching
  const stackArray: string[] = [];
  let current = stack;
  while (current) {
    stackArray.unshift(current.value.name);
    current = current.parent;
  }

  // Check if stackPath is a subsequence of stackArray
  let pathIndex = 0;
  for (const name of stackArray) {
    if (name === stackPath[pathIndex]) {
      pathIndex++;
      if (pathIndex === stackPath.length) return true;
    }
  }

  return false;
}

/**
 * Resolve the component for a key with full context (including stack)
 */
export function resolveWithStack(
  key: string,
  context: OverrideContextType,
  stack: RenderStackNode | null,
): ComponentType {
  const entry = registry.get(key);
  if (!entry) {
    throw new Error(`Component "${key}" not registered`);
  }

  // Find the first matching override
  for (const override of entry.overrides) {
    // Check base conditions
    if (!matchCondition(override.condition, context)) continue;

    // Check stack conditions
    if (
      override.condition?.stackPath &&
      !matchStackPath(stack, override.condition.stackPath)
    ) {
      continue;
    }

    return override.component;
  }

  return entry.base;
}

/**
 * Compute the resolution map for fast lookups (without stack conditions)
 */
export function computeResolutionMap(
  context: OverrideContextType,
): ResolutionMap {
  const resolutionMap: ResolutionMap = new Map();

  for (const [key, entry] of registry) {
    // Skip components that need stack-based resolution
    if (entry.hasStackConditions) continue;

    // Find the first matching override
    let resolved = entry.base;
    for (const override of entry.overrides) {
      if (matchCondition(override.condition, context)) {
        resolved = override.component;
        break;
      }
    }

    resolutionMap.set(key, resolved);
  }

  return resolutionMap;
}

/**
 * Get list of all registered component keys (for debugging)
 */
export function getRegisteredKeys(): string[] {
  return Array.from(registry.keys());
}

/**
 * Clear all overrides (useful for testing)
 */
export function clearOverrides(): void {
  for (const entry of registry.values()) {
    entry.overrides = [];
    entry.hasStackConditions = false;
  }

  notifyRegistryChange();
}

/**
 * Clear the entire registry (useful for testing)
 */
export function clearRegistry(): void {
  registry.clear();
  notifyRegistryChange();
}
