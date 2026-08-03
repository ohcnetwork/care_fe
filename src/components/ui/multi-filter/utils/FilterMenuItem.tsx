import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A context-free stand-in for `DropdownMenuItem`.
 *
 * `DropdownMenuItem` (Radix) only works when mounted inside an actual
 * `DropdownMenu.Root`/`Content` tree. Since MultiFilter's option lists are
 * rendered inside either a desktop `DropdownMenuContent` or a mobile
 * `DrawerContent` (see `ResponsiveFilterMenu`), list rows must not depend on
 * Radix menu context. This component replicates `DropdownMenuItem`'s look
 * and keyboard/selection behavior with a plain, focusable element so it can
 * be reused in both containers.
 */
function FilterMenuItem({
  className,
  disabled,
  onSelect,
  ref,
  ...props
}: React.ComponentProps<"div"> & {
  disabled?: boolean;
  onSelect?: (event: Event) => void;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const triggerSelect = (event: React.SyntheticEvent) => {
    if (disabled) return;
    onSelect?.(event.nativeEvent);
  };

  return (
    <div
      ref={ref}
      role="menuitem"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      data-slot="filter-menu-item"
      data-disabled={disabled}
      onClick={triggerSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          triggerSelect(event);
        }
      }}
      className={cn(
        "focus:bg-gray-100 focus:text-gray-900 [&_svg:not([class*='text-'])]:text-gray-500 relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 dark:focus:bg-gray-800 dark:focus:text-gray-50 dark:[&_svg:not([class*='text-'])]:text-gray-400",
        className,
      )}
      {...props}
    />
  );
}

export default FilterMenuItem;
