import * as React from "react";

import { cn } from "@/lib/utils";

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

export type FilterPresentation = "menu" | "drawer";

const FilterPresentationContext =
  React.createContext<FilterPresentation>("menu");

export function FilterPresentationProvider({
  presentation,
  children,
}: {
  presentation: FilterPresentation;
  children: React.ReactNode;
}) {
  return (
    <FilterPresentationContext.Provider value={presentation}>
      {children}
    </FilterPresentationContext.Provider>
  );
}

export function useFilterPresentation() {
  return React.useContext(FilterPresentationContext);
}

interface FilterSelectableItemProps {
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
  onSelect?: () => void;
  onFocus?: React.FocusEventHandler<HTMLElement>;
}

/**
 * Renders as DropdownMenuItem inside desktop menus, or as a button inside
 * the mobile Drawer (which has no Radix Menu ancestor).
 */
export const FilterSelectableItem = React.forwardRef<
  HTMLElement,
  FilterSelectableItemProps
>(function FilterSelectableItem(
  { onSelect, className, disabled, children, onFocus, style },
  ref,
) {
  const presentation = useFilterPresentation();

  if (presentation === "drawer") {
    return (
      <button
        type="button"
        ref={ref as React.Ref<HTMLButtonElement>}
        disabled={disabled}
        style={style}
        onFocus={onFocus}
        className={cn(
          "relative flex w-full cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm outline-hidden hover:bg-gray-50 focus:bg-gray-100 disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        onClick={() => {
          onSelect?.();
        }}
      >
        {children}
      </button>
    );
  }

  return (
    <DropdownMenuItem
      ref={ref as React.Ref<HTMLDivElement>}
      disabled={disabled}
      className={className}
      style={style}
      onFocus={onFocus}
      onSelect={(event) => {
        event.preventDefault();
        onSelect?.();
      }}
    >
      {children}
    </DropdownMenuItem>
  );
});

export function FilterSeparator({ className }: { className?: string }) {
  const presentation = useFilterPresentation();

  if (presentation === "drawer") {
    return (
      <div
        role="separator"
        className={cn("bg-gray-200 -mx-1 my-1 h-px", className)}
      />
    );
  }

  return <DropdownMenuSeparator className={className} />;
}
