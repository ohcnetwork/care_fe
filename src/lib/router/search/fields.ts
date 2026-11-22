import { z } from "zod";

/**
 * Field schemas for a route's `validateSearch`.
 *
 * The search serializer (`src/lib/router/searchParams.ts`) reads every value
 * as a string. When the page loads and on each navigation, the router runs
 * `validateSearch` and writes the output into the URL with `String(value)`.
 * So each field:
 *
 * - is optional and has no default (a default would appear in every URL),
 * - outputs a string, number or boolean that `String()` writes back as the
 *   input text (no `Date`, no trimming),
 * - reads an invalid value as `undefined`, so a bad bookmark does not fail
 *   the route. The router drops the value from the URL when the page loads.
 */

export const searchString = () => z.string().optional().catch(undefined);

/** A safe integer, from `2` or `"2"`. */
const integer = () =>
  z
    .union([
      z.number(),
      z
        .string()
        .regex(/^-?\d+$/)
        .transform(Number),
    ])
    .pipe(z.number().int());

/** An integer. Accepts `2` and `"2"`. */
export const searchInt = () => integer().optional().catch(undefined);

/** A positive integer, such as a page number. */
export const searchPositiveInt = () =>
  integer().pipe(z.number().positive()).optional().catch(undefined);

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

/** A `yyyy-MM-dd` calendar date. It stays a string. */
export const searchDate = () => z.iso.date().optional().catch(undefined);

/**
 * A path in this app, such as the page to go back to. A URL on another origin
 * reads as `undefined`, so a link cannot send the user off the app.
 */
export const searchAppPath = () =>
  z.string().refine(isAppPath).optional().catch(undefined);

function isAppPath(value: string) {
  try {
    const origin = window.location.origin;
    return new URL(value, origin).origin === origin;
  } catch {
    return false;
  }
}

/** The pagination keys that `useFilters` writes. */
export const paginationSearch = {
  page: searchPositiveInt(),
  limit: searchPositiveInt(),
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
