import { createContext, useContext, type ReactNode } from "react";

import { FilterChoiceMark } from "./filterChoiceMark";
import { FilterMenuItem } from "./filterSurface";

/**
 * Closes a single-select picker when its current choice is picked again, as
 * a select does. Pickers that close on a pick provide it; without it, picking
 * the current choice again does nothing.
 */
export const CloseOnRepickContext = createContext<(() => void) | undefined>(
  undefined,
);

export function FilterChoiceItem({
  multiple = false,
  checked,
  onChoose,
  children,
  className,
}: {
  multiple?: boolean;
  checked: boolean;
  onChoose: () => void;
  children: ReactNode;
  className?: string;
}) {
  const closeOnRepick = useContext(CloseOnRepickContext);
  return (
    <FilterMenuItem
      role={multiple ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={checked}
      className={className}
      onSelect={() => {
        if (multiple || !checked) onChoose();
        else closeOnRepick?.();
      }}
    >
      <FilterChoiceMark multiple={multiple} checked={checked} />
      {children}
    </FilterMenuItem>
  );
}
