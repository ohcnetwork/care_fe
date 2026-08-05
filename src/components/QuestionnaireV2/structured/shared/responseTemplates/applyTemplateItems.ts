import { t } from "i18next";
import { toast } from "sonner";

/**
 * Pre-existing i18n KEYS (not translated strings) for the four toasts
 * {@link applyTemplateItems} can show. Kept as keys — not
 * `(arg) => string` builders — because every real caller's copy is a
 * literal `t()` call with the SAME two interpolation shapes
 * (`{ applied, total }` for `partial`, `{ count, name }` for `success`),
 * so there is nothing a builder function would add beyond another layer of
 * indirection between the key and its interpolation.
 */
export interface ApplyTemplateItemsMessages {
  /** `toast.info` — the template has none of this type's items at all. */
  empty: string;
  /** `toast.error` — every item failed to resolve (a slug the facility no
   *  longer has, a deleted product, ...). */
  allFailed: string;
  /** `toast.warning` — interpolated with `{ applied, total }`. */
  partial: string;
  /** `toast.success` — interpolated with `{ count, name }`. */
  success: string;
}

/**
 * Resolves template items for one structured type into rows, tolerating
 * per-item failure. Throws when there are no items or all items fail; partial
 * success returns resolved rows with a warning toast. The caller must commit
 * rows in one `addRows` call to avoid stale edit snapshots.
 */
export async function applyTemplateItems<TSpec, TRow>(
  items: readonly TSpec[] | undefined,
  resolve: (spec: TSpec) => Promise<TRow>,
  templateName: string,
  messages: ApplyTemplateItemsMessages,
): Promise<TRow[]> {
  if (!items?.length) {
    toast.info(t(messages.empty));
    throw new Error("Template has no items of this type");
  }

  const results = await Promise.all(
    items.map(async (item): Promise<TRow | null> => {
      try {
        return await resolve(item);
      } catch {
        return null;
      }
    }),
  );
  // Not a type-predicate `.filter` — an unconstrained `TRow` makes
  // TypeScript's `Awaited<TRow>` unwrapping (it cannot rule out `TRow`
  // itself being thenable) reject a predicate typed `row is TRow` here. A
  // plain loop sidesteps it without narrowing `TRow`'s constraint just for
  // this.
  const rows: TRow[] = [];
  for (const result of results) {
    if (result !== null) rows.push(result);
  }

  if (rows.length === 0) {
    toast.error(t(messages.allFailed));
    throw new Error("Failed to apply template — every item failed to resolve");
  }

  if (rows.length < items.length) {
    toast.warning(
      t(messages.partial, { applied: rows.length, total: items.length }),
    );
  } else {
    toast.success(
      t(messages.success, { count: rows.length, name: templateName }),
    );
  }

  return rows;
}
