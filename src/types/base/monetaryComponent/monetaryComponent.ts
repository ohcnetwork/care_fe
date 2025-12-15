import { Code } from "@/types/base/code/code";
import { Condition } from "@/types/base/condition/condition";

export enum MonetaryComponentType {
  base = "base",
  discount = "discount",
  tax = "tax",
  surcharge = "surcharge",
  informational = "informational",
}

export interface MonetaryComponent {
  monetary_component_type: MonetaryComponentType;
  code?: Code;
  factor?: number;
  amount?: string;
  conditions?: Condition[];
}

export interface MonetaryComponentRead extends MonetaryComponent {
  title: string;
}

export const MonetaryComponentOrder = {
  informational: 1,
  base: 2,
  surcharge: 3,
  discount: 4,
  tax: 5,
} as const satisfies Record<MonetaryComponentType, number>;

// Utility functions for monetary component operations

/**
 * Compare two monetary components for equality based on type and code
 */
export function monetaryComponentIsEqual<T extends MonetaryComponent>(
  a: T,
  b: T,
): boolean {
  return (
    a.monetary_component_type === b.monetary_component_type &&
    a.code?.code === b.code?.code &&
    a.code?.system === b.code?.system
  );
}

/**
 * Get the effective value of a monetary component (factor or amount)
 */
export function getComponentValue(
  component: MonetaryComponent,
): number | string {
  return component.factor ?? component.amount ?? 0;
}

/**
 * Check if two components have the same amount or factor value
 */
export function isSameAmountOrFactor(
  a: MonetaryComponent,
  b: MonetaryComponent,
): boolean {
  return (
    (a.factor != null && a.factor === b.factor) ||
    (a.amount != null && a.amount === b.amount)
  );
}

/**
 * Check if a component is selected in a list of components
 */
export function isComponentSelected(
  component: MonetaryComponent,
  selectedComponents: MonetaryComponent[],
): boolean {
  return selectedComponents.some(
    (c) =>
      monetaryComponentIsEqual(c, component) &&
      isSameAmountOrFactor(c, component),
  );
}
