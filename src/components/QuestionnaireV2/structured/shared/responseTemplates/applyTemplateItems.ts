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
 * Resolves every item a template stores for ONE structured type into a row,
 * tolerating per-item failure — the "apply template" fetch loop
 * `ServiceRequestQuestion.tsx`'s `handleApplyTemplate` and
 * `MedicationRequestQuestion.tsx`'s own copy each hand-rolled, identically
 * shaped (`Promise.all` + null-filter + the same three-way toast
 * choreography) and differing only in what `resolve` fetches — an
 * `ActivityDefinitionReadSpec` by slug for one, product/medication data for
 * the other. This is the ONE place that choreography lives now.
 *
 * THROWS (deliberately, matching both legacy callers) in the two cases
 * `ManageResponseTemplatesSheet.tsx`'s `handleApplyTemplate` — the single
 * shared caller both legacy widgets already route through via
 * `onTemplateSelect` — relies on to skip its own "applied" checkmark
 * animation and clear `applyingTemplateId` through its `catch` block
 * instead: the template has nothing of this type (`items` empty/absent), or
 * every item failed to resolve. A partial success (some, not all, resolved)
 * does NOT throw — it returns the rows that DID resolve, with a warning
 * toast naming the shortfall, exactly like legacy's
 * `template_partially_applied` path.
 *
 * Does not add anything anywhere itself — the caller commits the returned
 * rows via ONE `list.addRows(rows)` call, never a loop of `list.addRow`
 * (two mutator calls issued synchronously in the same handler both read the
 * same stale `edits` snapshot — see `useStructuredRows.ts`'s own doc
 * comment, item under "CAVEAT for every mutator" — so a loop would silently
 * drop every row but the last).
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
