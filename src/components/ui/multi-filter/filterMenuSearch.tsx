import { Menu } from "@base-ui/react/menu";
import { createContext, useContext, useState, type ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const SearchContext = createContext<{
  search: string;
  setSearch: (value: string) => void;
} | null>(null);

export function FilterMenuSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [search, setSearch] = useState("");
  return (
    <SearchContext.Provider value={{ search, setSearch }}>
      <Menu.FilterProvider
        value={search}
        onValueChange={setSearch}
        filter={null}
        autoHighlight
      >
        {children}
      </Menu.FilterProvider>
    </SearchContext.Provider>
  );
}

export function useFilterMenuSearch() {
  const context = useContext(SearchContext);
  if (!context) throw new Error("Filter menu search requires its provider");
  return context;
}

/** Picker search. With `onBack`, ArrowLeft in an empty search goes back. */
export function FilterMenuSearch({
  placeholder,
  onBack,
}: {
  placeholder: string;
  onBack?: () => void;
}) {
  const { search } = useFilterMenuSearch();
  return (
    <Menu.Input
      render={<Input autoSpace={false} />}
      aria-label={placeholder}
      placeholder={placeholder}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" && !search && onBack) {
          event.preventDefault();
          onBack();
        }
      }}
    />
  );
}

export function FilterMenuList({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <Menu.List
      className={cn(
        "**:data-highlighted:bg-accent **:data-highlighted:text-accent-foreground",
        className,
      )}
    >
      {children}
    </Menu.List>
  );
}
