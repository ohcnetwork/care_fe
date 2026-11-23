import type { ReactNode } from "react";

import { FilterChoiceMark } from "./filterChoiceMark";
import { FilterMenuItem } from "./filterSurface";

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
  return (
    <FilterMenuItem
      role={multiple ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={checked}
      className={className}
      onSelect={() => {
        if (multiple || !checked) onChoose();
      }}
    >
      <FilterChoiceMark multiple={multiple} checked={checked} />
      {children}
    </FilterMenuItem>
  );
}
