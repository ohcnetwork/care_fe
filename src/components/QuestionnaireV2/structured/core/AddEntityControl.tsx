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
 * row — the pattern five legacy widgets (allergy, symptom, diagnosis,
 * medication_statement, medication_request) each re-implement around the
 * shared drawer, staging the freshly-picked entity in local `useState` and
 * writing their own confirm handler. `allergy_intolerance` is the first
 * structured-v2 consumer; three more (symptom, diagnosis,
 * medication_statement) adopt this next.
 *
 * DESKTOP: a selection is added straight away — there is no separate
 * "confirm" step; the row lands in the list already interactive, and every
 * field is editable there (mirrors `AllergyQuestion.tsx`'s
 * `addNewAllergy`).
 *
 * MOBILE: a selection is staged (never committed) until the clinician taps
 * the drawer's own Done button, so a picked-then-abandoned entity (closing
 * the drawer, or picking a different one first) never reaches the list at
 * all. `open` is DERIVED from `staged !== null` — not independent state —
 * so the outer confirm drawer and "is something staged" can never disagree
 * with each other (mirrors `AllergyQuestion.tsx`'s
 * `open={!!newAllergyInSheet}`).
 *
 * `handleConfirm` reads `staged` from the render closure rather than inside
 * `setStaged`'s updater — a functional updater must stay pure, and
 * `onAdd` is a real side effect (it records an edit). Reading the outer
 * `staged` (as the legacy `handleConfirmAllergy` does) is what keeps this
 * safe under StrictMode's dev-only double-invocation of state updaters: an
 * updater-based `onAdd` call would fire twice and add the row twice.
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
