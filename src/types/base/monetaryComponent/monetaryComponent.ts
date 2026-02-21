import { CURRENCY_SYMBOL } from "@/components/ui/monetary-display";
import { Code } from "@/types/base/code/code";
import { Condition } from "@/types/base/condition/condition";
import {
  add,
  decimal,
  divide,
  isEqual,
  multiply,
  round,
} from "@/Utils/decimal";
import Decimal from "decimal.js";

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
  factor?: string | null;
  amount?: string | null;
  tax_included_amount?: string;
  conditions?: Condition[];
  global_component?: boolean;
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
export function getComponentNumericValue(component: MonetaryComponent) {
  return component.factor ?? component.amount ?? "0";
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
    ? `${round(value)}%`
    : `${currencySymbol}${round(value)}`;
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
    return isEqual(a.factor, b.factor);
  }
  if (!isPercentageBased(a) && !isPercentageBased(b)) {
    return isEqual(a.amount, b.amount);
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

export function getBasePrice(priceComponents: MonetaryComponent[]): Decimal {
  const basePrice = priceComponents.find(
    (c) => c.monetary_component_type === MonetaryComponentType.base,
  )?.amount;
  return basePrice ? decimal(basePrice) : new Decimal(0);
}

/**
 * Calculate the effective amount for a component given a base amount
 * Handles both percentage-based (factor) and fixed (amount) components
 */
export function calculateComponentAmount(
  component: MonetaryComponent,
  baseAmount: Decimal,
): Decimal {
  if (component.factor != null) {
    // Percentage-based: amount = baseAmount * (factor / 100)
    return multiply(baseAmount, divide(component.factor, 100));
  }
  if (component.amount != null) {
    return decimal(component.amount);
  }
  return new Decimal(0);
}

/**
 * Get total surcharges for price components
 */
export function getSurchargeAmount(
  priceComponents: MonetaryComponent[],
  baseAmount?: Decimal,
): Decimal {
  const base = baseAmount ?? getBasePrice(priceComponents);
  const surcharges = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.surcharge,
  );

  return surcharges.reduce(
    (total, component) => add(total, calculateComponentAmount(component, base)),
    new Decimal(0),
  );
}

/**
 * Get total discounts for price components
 */
export function getDiscountAmount(
  priceComponents: MonetaryComponent[],
  baseAmount?: Decimal,
): Decimal {
  const base = baseAmount ?? getBasePrice(priceComponents);
  const discounts = priceComponents.filter(
    (c) =>
      c.monetary_component_type === MonetaryComponentType.discount &&
      c.conditions?.length === 0,
  );

  return discounts.reduce(
    (total, component) => add(total, calculateComponentAmount(component, base)),
    new Decimal(0),
  );
}

/**
 * Calculate subtotal (base + surcharges - discounts)
 * This is the amount before tax
 */
export function calculateSubtotal(
  priceComponents: MonetaryComponent[],
): Decimal {
  const base = getBasePrice(priceComponents);
  const surcharges = getSurchargeAmount(priceComponents, base);
  const discounts = getDiscountAmount(priceComponents, base);

  return add(base, surcharges).minus(discounts);
}

/**
 * Get total tax amount for price components
 * Tax is calculated on the subtotal (base + surcharges - discounts)
 */
export function getTaxAmount(
  priceComponents: MonetaryComponent[],
  subtotal?: Decimal,
): Decimal {
  const taxableAmount = subtotal ?? calculateSubtotal(priceComponents);
  const taxes = priceComponents.filter(
    (c) => c.monetary_component_type === MonetaryComponentType.tax,
  );

  return taxes.reduce(
    (total, component) =>
      add(total, calculateComponentAmount(component, taxableAmount)),
    new Decimal(0),
  );
}

/**
 * Calculate the total price including all components (base, surcharges, discounts, tax)
 * Returns the final amount the customer pays
 */
export function calculateTotalPrice(
  priceComponents: MonetaryComponent[],
): Decimal {
  const subtotal = calculateSubtotal(priceComponents);
  const tax = getTaxAmount(priceComponents, subtotal);

  return add(subtotal, tax);
}

/**
 * Calculate the total price for a given quantity
 */
export function calculateTotalPriceWithQuantity(
  priceComponents: MonetaryComponent[],
  quantity: string | number,
): Decimal {
  const unitPrice = calculateTotalPrice(priceComponents);
  return multiply(unitPrice, quantity);
}

/**
 * Get a breakdown of all price components
 */
export interface PriceBreakdown {
  basePrice: string;
  surcharges: string;
  discounts: string;
  subtotal: string;
  tax: string;
  total: string;
}

export function getPriceBreakdown(
  priceComponents: MonetaryComponent[],
  quantity: string | number = 1,
): PriceBreakdown {
  const base = getBasePrice(priceComponents);
  const surcharges = getSurchargeAmount(priceComponents, base);
  const discounts = getDiscountAmount(priceComponents, base);
  const subtotal = add(base, surcharges).minus(discounts);
  const tax = getTaxAmount(priceComponents, subtotal);
  const total = add(subtotal, tax);

  const qty = decimal(quantity);

  return {
    basePrice: round(multiply(base, qty)),
    surcharges: round(multiply(surcharges, qty)),
    discounts: round(multiply(discounts, qty)),
    subtotal: round(multiply(subtotal, qty)),
    tax: round(multiply(tax, qty)),
    total: round(multiply(total, qty)),
  };
}
