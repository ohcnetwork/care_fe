import type { ComponentType, ReactNode } from "react";

/**
 * Override Framework Types
 *
 * These types define the core structure of the override system.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyProps = Record<string, any>;

/**
 * Context information available for override resolution
 */
export interface OverrideContextType {
  /** Current page/route identifier */
  page?: string;
  /** Current route path */
  route?: string;
  /** User's role */
  userRole?: string;
  /** Type of facility being accessed */
  facilityType?: string;
  /** Custom context values from plugins */
  custom?: Record<string, unknown>;
}

/**
 * A single node in the render stack (linked list structure)
 */
export interface RenderStackNode {
  value: {
    name: string;
  };
  parent: RenderStackNode | null;
}

/**
 * Condition for when an override should be applied
 */
export interface OverrideCondition {
  /** Match specific pages */
  page?: string | string[];
  /** Match specific user roles */
  userRole?: string | string[];
  /** Match specific facility types */
  facilityType?: string | string[];
  /** Match based on render stack (component ancestry) */
  stackPath?: string[];
  /** Custom matcher function */
  custom?: (context: OverrideContextType) => boolean;
}

/**
 * An override definition for a component
 */
export interface Override<P = AnyProps> {
  /** The replacement component */
  component: ComponentType<P>;
  /** Conditions for when this override applies */
  condition?: OverrideCondition;
  /** Priority (higher = more important, default 0) */
  priority?: number;
  /** Optional description for debugging */
  description?: string;
}

/**
 * Registry entry for a single component
 */
export interface RegistryEntry<P = AnyProps> {
  /** The base/default component */
  base: ComponentType<P>;
  /** List of registered overrides */
  overrides: Override<P>[];
  /** Whether any override uses stack conditions (optimization flag) */
  hasStackConditions: boolean;
}

/**
 * The global component registry
 */
export type Registry = Map<string, RegistryEntry>;

/**
 * Precomputed resolution map for fast lookups
 */
export type ResolutionMap = Map<string, ComponentType>;

/**
 * Props for the OverrideProvider component
 */
export interface OverrideProviderProps {
  children: ReactNode;
  /** Override context values */
  context?: Partial<OverrideContextType>;
}
