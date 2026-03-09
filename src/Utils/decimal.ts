import careConfig from "@careConfig";
import Decimal from "decimal.js";
import { z } from "zod";

// Configure Decimal.js to match backend settings
// Backend uses: DecimalField(max_digits=20, decimal_places=6)
Decimal.set({
  precision: careConfig.decimal.precision,
  rounding: careConfig.decimal.rounding,
});

/**
 * Accounting display precision (matches backend ACCOUNTING_PRECISION)
 */
export const ACCOUNTING_PRECISION = careConfig.decimal.accountingPrecision;

/**
 * Create a Decimal from a string value (API response format)
 */
export function decimal(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Add multiple decimal values
 */
export function add(...values: (string | number | Decimal)[]): Decimal {
  return values.reduce<Decimal>((sum, val) => sum.plus(val), new Decimal(0));
}

/**
 * Subtract: a - b
 */
export function subtract(
  a: string | number | Decimal,
  b: string | number | Decimal,
): Decimal {
  return new Decimal(a).minus(b);
}

/**
 * Multiply: a * b
 */
export function multiply(
  a: string | number | Decimal,
  b: string | number | Decimal,
): Decimal {
  return new Decimal(a).times(b);
}

/**
 * Divide: a / b
 */
export function divide(
  a: string | number | Decimal,
  b: string | number | Decimal,
): Decimal {
  return new Decimal(a).dividedBy(b);
}

/**
 * Round to accounting precision (for display)
 */
export function round(value: string | number | Decimal): string {
  return new Decimal(value).toFixed(ACCOUNTING_PRECISION);
}

/**
 * Round whole numbers to accounting precision
 */
export function roundWhole(value: string | number | Decimal): string {
  return new Decimal(value).toFixed(0);
}

export function roundUp(value: string | number | Decimal): string {
  return new Decimal(value).toFixed(0, Decimal.ROUND_UP);
}

/**
 * Compare two decimal values
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
export function compare(
  a: string | number | Decimal,
  b: string | number | Decimal,
): number {
  return new Decimal(a).comparedTo(b);
}

/**
 * Compare two decimal values for equality
 */
export function isEqual(
  a: string | number | Decimal | null | undefined,
  b: string | number | Decimal | null | undefined,
): boolean {
  if (a == null || b == null) {
    return a === b;
  }
  return new Decimal(a).equals(b);
}

/**
 * Check if value is greater than comparison
 */
export function isGreaterThan(
  value: string | number | Decimal,
  comparison: string | number | Decimal,
): boolean {
  return new Decimal(value).greaterThan(comparison);
}

/**
 * Check if value is greater than or equal to comparison
 */
export function isGreaterThanOrEqual(
  value: string | number | Decimal,
  comparison: string | number | Decimal,
): boolean {
  return new Decimal(value).greaterThanOrEqualTo(comparison);
}

/**
 * Check if value is less than or equal to comparison
 */
export function isLessThanOrEqual(
  value: string | number | Decimal,
  comparison: string | number | Decimal,
): boolean {
  return new Decimal(value).lessThanOrEqualTo(comparison);
}

/**
 * Check if value is less than comparison
 */
export function isLessThan(
  value: string | number | Decimal,
  comparison: string | number | Decimal,
): boolean {
  return new Decimal(value).lessThan(comparison);
}

/**
 * Check if value is zero
 */
export function isZero(value: string | number | Decimal): boolean {
  if (value === "") {
    return false;
  }
  return new Decimal(value).isZero();
}

/**
 * Check if value is positive (> 0)
 */
export function isPositive(value: string | number | Decimal): boolean {
  if (value === "") {
    return false;
  }
  return new Decimal(value).isPositive() && !new Decimal(value).isZero();
}

/**
 * Check if value is negative (< 0)
 */
export function isNegative(value: string | number | Decimal): boolean {
  if (value === "") {
    return false;
  }
  return new Decimal(value).isNegative() && !new Decimal(value).isZero();
}

/**
 * Convert to number (use sparingly, only for display/charting)
 */
export function toNumber(value: string | number | Decimal): number {
  return new Decimal(value).toNumber();
}

/**
 * Convert to string (for API submission)
 */
export function toString(value: string | number | Decimal): string {
  return new Decimal(value).toString();
}

/**
 * Zod schema for decimal input fields
 * Validates as number, transforms to string for API submission
 *
 * Usage:
 *   const schema = z.object({
 *     quantity: zodDecimal({ min: 1 }),
 *   });
 */
export const zodDecimal = (options?: {
  min?: number;
  max?: number;
  message?: string;
}) =>
  z
    .string()
    .refine((val) => !isNaN(Number(val)) && val.trim() !== "", {
      message: options?.message || "Must be a valid number",
    })
    .refine((val) => options?.min === undefined || Number(val) >= options.min, {
      message: `Must be at least ${options?.min}`,
    })
    .refine((val) => options?.max === undefined || Number(val) <= options.max, {
      message: `Must be at most ${options?.max}`,
    })
    .transform(round);

/**
 * Absolute value of a decimal value
 */
export function abs(value: string | number | Decimal): Decimal {
  if (value === "") {
    return new Decimal(0);
  }
  return new Decimal(value).abs();
}

/**
 * Returns the maximum of given decimal values
 */
export function max(...values: (string | number | Decimal)[]): Decimal {
  const result = values.map((v) =>
    v === "" ? new Decimal(0) : new Decimal(v),
  );
  return Decimal.max(...result);
}

/**
 * Returns the minimum of given decimal values
 */
export function min(...values: (string | number | Decimal)[]): Decimal {
  const result = values.map((v) =>
    v === "" ? new Decimal(0) : new Decimal(v),
  );
  return Decimal.min(...result);
}
