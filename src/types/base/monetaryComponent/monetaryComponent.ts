import { CURRENCY_SYMBOL } from "@/components/ui/monetary-display";
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
 * Check if component uses percentage-based factor (vs fixed amount)
 */
export function isPercentageBased(component: MonetaryComponent): boolean {
  return component.factor != null;
}

/**
 * Get the numeric value of a monetary component
 * Returns the factor (percentage) or parsed amount (fixed)
 */
export function getComponentNumericValue(component: MonetaryComponent): number {
  if (component.factor != null) {
    return component.factor;
  }
  return parseFloat(component.amount || "0") || 0;
}

/**
 * Format component value for display with appropriate suffix
 */
export function formatComponentValue(
  component: MonetaryComponent,
  currencySymbol = CURRENCY_SYMBOL,
): string {
  const value = getComponentNumericValue(component);
  return isPercentageBased(component)
    ? `${value}%`
    : `${currencySymbol}${value}`;
}

/**
 * Compare two monetary components for equality based on code identity
 * Note: Does not compare values, only identity (code system + code)
 */
export function isSameComponentCode(
  a: MonetaryComponent,
  b: MonetaryComponent,
): boolean {
  // Components without codes cannot be compared by code identity
  if (!a.code || !b.code) {
    return false;
  }
  return a.code?.code === b.code?.code && a.code?.system === b.code?.system;
}

/**
 * Check if two components have the same value (factor or amount)
 */
export function isSameValue(
  a: MonetaryComponent,
  b: MonetaryComponent,
): boolean {
  if (isPercentageBased(a) && isPercentageBased(b)) {
    return a.factor === b.factor;
  }
  if (!isPercentageBased(a) && !isPercentageBased(b)) {
    return a.amount === b.amount;
  }
  return false;
}

/**
 * Check if a component exists in a list with matching code and value
 */
export function isComponentSelected(
  component: MonetaryComponent,
  selectedComponents: MonetaryComponent[],
): boolean {
  return selectedComponents.some(
    (selected) =>
      isSameComponentCode(selected, component) &&
      isSameValue(selected, component),
  );
}
