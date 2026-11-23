import type { ReactNode } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

import { FilterChoiceMark } from "./filterChoiceMark";

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
    <DropdownMenuItem
      role={multiple ? "menuitemcheckbox" : "menuitemradio"}
      aria-checked={checked}
      closeOnClick={false}
      className={className}
      onClick={() => {
        if (multiple || !checked) onChoose();
      }}
    >
      <FilterChoiceMark multiple={multiple} checked={checked} />
      {children}
    </DropdownMenuItem>
  );
}
