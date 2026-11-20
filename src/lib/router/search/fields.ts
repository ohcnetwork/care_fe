import { z } from "zod";

/**
 * Field schemas for a route's `validateSearch`.
 *
 * The search serializer (`src/lib/router/searchParams.ts`) reads every value
 * as a string. On each navigation the router runs `validateSearch` again and
 * writes the output into the URL with `String(value)`. So each field:
 *
 * - is optional and has no default (a default would appear in every URL),
 * - outputs a string, number or boolean that `String()` writes back as the
 *   input text (no `Date`, no trimming),
 * - reads an invalid value as `undefined`, so a bad bookmark does not fail
 *   the route. The next navigation drops the value from the URL.
 */

export const searchString = () => z.string().optional().catch(undefined);

/** An integer. Accepts `2` and `"2"`. */
export const searchInt = () =>
  z
    .union([
      z.number().int(),
      z
        .string()
        .regex(/^-?\d+$/)
        .transform(Number),
    ])
    .optional()
    .catch(undefined);

/** Accepts `true`, `"true"`, `false` and `"false"`. */
export const searchBoolean = () =>
  z
    .union([
      z.boolean(),
      z.enum(["true", "false"]).transform((value) => value === "true"),
    ])
    .optional()
    .catch(undefined);

/** One of `values`: a string array or a TypeScript string enum. */
export function searchEnum<const T extends readonly string[]>(
  values: T,
): z.ZodCatch<z.ZodOptional<z.ZodEnum<z.core.util.ToEnum<T[number]>>>>;
// Overloads are not redeclarations; TypeScript checks real ones (TS2451).
// eslint-disable-next-line no-redeclare
export function searchEnum<const T extends z.core.util.EnumLike>(
  values: T,
): z.ZodCatch<z.ZodOptional<z.ZodEnum<T>>>;
// eslint-disable-next-line no-redeclare
export function searchEnum(values: readonly string[] | z.core.util.EnumLike) {
  return z
    .enum(values as z.core.util.EnumLike)
    .optional()
    .catch(undefined);
}

/** A `yyyy-MM-dd` date. It stays a string. */
export const searchDate = () =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .catch(undefined);

/** The pagination keys that `useFilters` writes. */
export const paginationSearch = {
  page: searchInt(),
  limit: searchInt(),
};

/** A search schema: an object of the fields above. */
export type SearchSchema = z.ZodType<Record<string, unknown>>;

/**
 * Typed search values. Keys that the schema does not list keep their raw
 * value, typed `unknown`.
 */
export type SearchValues<S extends SearchSchema> = z.output<S> &
  Record<string, unknown>;

/**
 * Reads raw search values with `schema`, as the router does for a route:
 * the parsed values over the raw ones.
 */
export function readSearch<S extends SearchSchema>(
  schema: S,
  raw: Record<string, unknown>,
): SearchValues<S> {
  return { ...raw, ...schema.parse(raw) };
}
