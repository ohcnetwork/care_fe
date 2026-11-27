import {
  createContext,
  useContext,
  useId,
  type ComponentProps,
  type KeyboardEvent,
} from "react";

import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

/**
 * Where filter pickers render. Chip layouts open each picker in its own Base
 * UI menu popup. The compact toolbar hosts its views (Active filters, the
 * field list, a picker) inside one popover on desktop and one drawer on
 * mobile, where menu parts can't mount, so the parts below render plain
 * elements with the same roles there.
 */
export type FilterSurface = "menu" | "popup" | "drawer";

export const FilterSurfaceContext = createContext<FilterSurface>("menu");

export function useFilterSurface() {
  return useContext(FilterSurfaceContext);
}

/** Lets a drawer picker's search highlight rows, as Base UI's menu input does. */
export const FilterListHighlightContext = createContext<{
  highlightedId: string | null;
} | null>(null);

// Matches DropdownMenuItem, including its desktop row height.
const drawerItemClass =
  "group/dropdown-menu-item relative flex min-h-11 cursor-default items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm outline-hidden select-none active:bg-accent data-highlighted:bg-accent data-highlighted:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground aria-disabled:pointer-events-none aria-disabled:opacity-50 md:min-h-10 md:px-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

/** Rows a drawer list steps through with the arrow keys. */
export const FILTER_DRAWER_ITEM_SELECTOR =
  '[data-slot="filter-drawer-item"]:not([aria-disabled="true"])';

type FilterMenuItemProps = Omit<ComponentProps<"div">, "onSelect"> & {
  /** Runs on click, Enter or Space. The menu stays open. */
  onSelect: () => void;
  disabled?: boolean;
};

export function FilterMenuItem({
  onSelect,
  disabled,
  className,
  role = "menuitem",
  id,
  ...props
}: FilterMenuItemProps) {
  const surface = useFilterSurface();
  const highlight = useContext(FilterListHighlightContext);
  const fallbackId = useId();
  const itemId = id ?? fallbackId;

  if (surface === "menu") {
    return (
      <DropdownMenuItem
        {...props}
        id={id}
        role={role}
        disabled={disabled}
        closeOnClick={false}
        className={className}
        onClick={onSelect}
      />
    );
  }

  const select = () => {
    if (!disabled) onSelect();
  };
  return (
    <div
      {...props}
      id={itemId}
      role={role}
      tabIndex={-1}
      data-slot="filter-drawer-item"
      data-highlighted={highlight?.highlightedId === itemId ? "" : undefined}
      aria-disabled={disabled || undefined}
      className={cn(drawerItemClass, className)}
      onClick={select}
      onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
        props.onKeyDown?.(event);
        if (event.defaultPrevented) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          select();
        }
      }}
    />
  );
}

// Names a plain group after its label, as Base UI's menu group does.
const GroupLabelIdContext = createContext<string | null>(null);

export function FilterMenuGroup({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const labelId = useId();
  return useFilterSurface() === "menu" ? (
    <DropdownMenuGroup className={className}>{children}</DropdownMenuGroup>
  ) : (
    <GroupLabelIdContext.Provider value={labelId}>
      <div role="group" aria-labelledby={labelId} className={className}>
        {children}
      </div>
    </GroupLabelIdContext.Provider>
  );
}

export function FilterMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const surface = useFilterSurface();
  const labelId = useContext(GroupLabelIdContext);
  if (surface === "menu" || !labelId) {
    // Outside a menu group, DropdownMenuLabel already renders a plain div.
    return (
      <DropdownMenuLabel className={className}>{children}</DropdownMenuLabel>
    );
  }
  return (
    <div
      id={labelId}
      data-slot="dropdown-menu-label"
      className={cn(
        "text-soft-foreground px-2 py-1.5 text-xs font-medium",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FilterMenuSeparator({ className }: { className?: string }) {
  return useFilterSurface() === "menu" ? (
    <DropdownMenuSeparator className={className} />
  ) : (
    <div
      role="separator"
      className={cn("bg-border -mx-1 my-1 h-px", className)}
    />
  );
}
