import { useCallback, useState, type ReactNode } from "react";

import { EntitySelectionDrawer } from "@/components/Questionnaire/EntitySelectionDrawer";
import ValueSetSelect from "@/components/Questionnaire/ValueSetSelect";

import useBreakpoints from "@/hooks/useBreakpoints";

import type { Code } from "@/types/base/code/code";

export interface AddEntityControlProps<TRow extends object> {
  /** The ValueSet lookup system, e.g. `"system-allergy-code"`. */
  system: string;
  /** For `EntitySelectionDrawer`'s own translation keys
   *  (`select_${entityType}`, `add_another_${entityType}`). */
  entityType: string;
  /** Already-translated — becomes the desktop trigger's placeholder and the
   *  mobile "+ " button's label. */
  placeholder: string;
  disabled?: boolean;
  searchPostFix?: string;
  /** Builds the row this control adds — desktop adds it immediately on
   *  selection; mobile builds the SAME row but stages it for editing first
   *  (see {@link renderStagedRow}). */
  createRow: (code: Code) => TRow;
  /** Commits a row — `list.addRow` in practice. */
  onAdd: (row: TRow) => void;
  /**
   * Mobile only: the staged row's own editable fields, rendered inside the
   * drawer between "pick an entity" and "confirm". `updateStaged` merges a
   * partial patch onto the currently staged row.
   */
  renderStagedRow: (
    staged: TRow,
    updateStaged: (patch: Partial<TRow>) => void,
  ) => ReactNode;
}

/**
 * Desktop inline `ValueSetSelect` vs. mobile staged `EntitySelectionDrawer`
 * row — the shared add-entity flow for the allergy, symptom, diagnosis and
 * medication_statement editors.
 *
 * DESKTOP: a selection is added straight away — no separate confirm step;
 * the row lands in the list already interactive, every field editable
 * there.
 *
 * MOBILE: a selection is staged (never committed) until the clinician taps
 * the drawer's own Done button, so a picked-then-abandoned entity never
 * reaches the list. `open` is DERIVED from `staged !== null` — not
 * independent state — so the confirm drawer and "is something staged" can
 * never disagree.
 *
 * `handleConfirm` reads `staged` from the render closure rather than inside
 * `setStaged`'s updater: a functional updater must stay pure, and `onAdd`
 * is a real side effect — under StrictMode's dev-only double-invocation an
 * updater-based `onAdd` would fire twice and add the row twice.
 */
export function AddEntityControl<TRow extends object>({
  system,
  entityType,
  placeholder,
  disabled,
  searchPostFix,
  createRow,
  onAdd,
  renderStagedRow,
}: AddEntityControlProps<TRow>) {
  const isMobile = useBreakpoints({ default: true, lg: false });
  const [staged, setStaged] = useState<TRow | null>(null);

  const handleEntitySelected = useCallback(
    (code: Code) => {
      const row = createRow(code);
      if (isMobile) {
        setStaged(row);
      } else {
        onAdd(row);
      }
    },
    [isMobile, createRow, onAdd],
  );

  const handleConfirm = useCallback(() => {
    if (!staged) return;
    onAdd(staged);
    setStaged(null);
  }, [staged, onAdd]);

  const updateStaged = useCallback((patch: Partial<TRow>) => {
    setStaged((current) => (current ? { ...current, ...patch } : current));
  }, []);

  if (!isMobile) {
    return (
      <ValueSetSelect
        system={system}
        placeholder={placeholder}
        onSelect={handleEntitySelected}
        disabled={disabled}
        searchPostFix={searchPostFix}
      />
    );
  }

  return (
    <EntitySelectionDrawer
      open={staged !== null}
      onOpenChange={(open) => {
        if (!open) setStaged(null);
      }}
      system={system}
      entityType={entityType}
      disabled={disabled}
      searchPostFix={searchPostFix}
      onEntitySelected={handleEntitySelected}
      onConfirm={handleConfirm}
      placeholder={placeholder}
    >
      {staged && renderStagedRow(staged, updateStaged)}
    </EntitySelectionDrawer>
  );
}
