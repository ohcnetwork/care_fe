import { Menu } from "@base-ui/react/menu";
import {
  createContext,
  useContext,
  useId,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import {
  FILTER_DRAWER_ITEM_SELECTOR,
  FilterListHighlightContext,
  useFilterSurface,
} from "./filterSurface";

const SearchContext = createContext<{
  search: string;
  setSearch: (value: string) => void;
  listId: string;
  highlightedId: string | null;
  setHighlightedId: (id: string | null) => void;
} | null>(null);

export function FilterMenuSearchProvider({
  children,
}: {
  children: ReactNode;
}) {
  const surface = useFilterSurface();
  const [search, setSearch] = useState("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const listId = useId();
  const context = {
    search,
    setSearch: (value: string) => {
      setSearch(value);
      setHighlightedId(null);
    },
    listId,
    highlightedId,
    setHighlightedId,
  };
  return (
    <SearchContext.Provider value={context}>
      {surface === "menu" ? (
        <Menu.FilterProvider
          value={search}
          onValueChange={context.setSearch}
          filter={null}
          autoHighlight
        >
          {children}
        </Menu.FilterProvider>
      ) : (
        <FilterListHighlightContext.Provider value={{ highlightedId }}>
          {children}
        </FilterListHighlightContext.Provider>
      )}
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
  const { search, setSearch, listId, highlightedId, setHighlightedId } =
    useFilterMenuSearch();
  const surface = useFilterSurface();
  const goBack = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowLeft" && !search && onBack) {
      event.preventDefault();
      onBack();
      return true;
    }
    return false;
  };

  if (surface === "menu") {
    return (
      <Menu.Input
        render={<Input autoSpace={false} />}
        aria-label={placeholder}
        placeholder={placeholder}
        onKeyDown={goBack}
      />
    );
  }

  // Focus stays in search while the arrows move the highlight, as in the
  // menu. In a popup the search takes focus as the picker appears. A
  // searchbox, unlike a combobox, isn't focused when the drawer opens, so the
  // on-screen keyboard only opens when the user taps the field.
  const rows = () =>
    Array.from(
      document
        .getElementById(listId)
        ?.querySelectorAll<HTMLElement>(FILTER_DRAWER_ITEM_SELECTOR) ?? [],
    );
  return (
    <Input
      type="text"
      role="searchbox"
      inputMode="search"
      autoSpace={false}
      autoFocus={surface === "popup"}
      aria-label={placeholder}
      placeholder={placeholder}
      aria-controls={listId}
      aria-activedescendant={highlightedId ?? undefined}
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      onKeyDown={(event) => {
        if (goBack(event)) return;
        const items = rows();
        const index = items.findIndex((item) => item.id === highlightedId);
        const move = (next: number) => {
          event.preventDefault();
          const item = items[(next + items.length) % items.length];
          if (!item) return;
          setHighlightedId(item.id);
          item.scrollIntoView({ block: "nearest" });
        };
        if (event.key === "ArrowDown") move(index + 1);
        else if (event.key === "ArrowUp")
          move(index < 0 ? items.length - 1 : index - 1);
        else if (event.key === "Enter") {
          // Like the menu's auto-highlight: Enter picks the first match.
          const item = items[index] ?? (search ? items[0] : undefined);
          if (!item) return;
          event.preventDefault();
          item.click();
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
  const surface = useFilterSurface();
  const { listId } = useFilterMenuSearch();
  const highlightClass =
    "**:data-highlighted:bg-accent **:data-highlighted:text-accent-foreground";
  return surface === "menu" ? (
    <Menu.List className={cn(highlightClass, className)}>{children}</Menu.List>
  ) : (
    // A drawer has room for a longer list than the menu's 30vh.
    // A scrollable list is keyboard-focusable in Chromium; the search owns
    // focus, so Tab must skip it.
    <div
      id={listId}
      role="menu"
      tabIndex={-1}
      className={cn(
        highlightClass,
        className,
        surface === "drawer" && "max-h-[50dvh]",
      )}
    >
      {children}
    </div>
  );
}
