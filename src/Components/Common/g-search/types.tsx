export interface Searchable {
  [tag: string]: {
    match: (query: string) => boolean;
    onSelect?: (item: any) => void;
    onDeSelect?: (item: any) => void;
  };
}

// export interface Dependencies {
//   [tag: string]: any[];
// }
export interface Dependency {
  tag: string;
  required?: boolean;
}

export type Dependant = Dependency;

export interface Dependants {
  [tag: string]: Dependant[];
}

export interface Selectables {
  [tag: string]: {
    badge?: string;
    data?: any[];
    dependsOn?: Dependency[];
    match?: (query: string, item: any) => boolean; // matches search text with item
    label?: (item: any) => string; // returns label for item
    render?: (item: any) => React.ReactNode; // returns react node for item
    fetchDataOnSearch?: (searchText: string) => Promise<any>;
    fetchDataOnInit?: () => Promise<any>;
    compare?: (a: any, b: any) => number | boolean; // compares two items
    onSelect?: (item: any) => void;
    onDeSelect?: (item: any) => void;
    multiple?: boolean;
    fetctDataOnDependancyChange?: (
      item: any,
      tag: string,
      data: any,
      action: "select" | "deselect"
    ) => Promise<any>;
  };
}

export interface SelectedFilters {
  [tag: string]: Set<any>;
}

export interface SearchResult {
  item: any;
  tag: string;
  type: string;
}

export interface GSearchProps {
  searchables?: Searchable;
  selectables?: Selectables;
  onChange?: (selectedFilters: SelectedFilters) => void;
  className?: string;
}

export interface Badge {
  label: string;
  key?: string;
  selected?: boolean;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  leadingIcon?: React.ReactNode;
  leadingIconClassName?: string;
  leadingIconOnClick?: (e: React.MouseEvent) => void;
  trailingIcon?: React.ReactNode;
  trailingIconClassName?: string;
  trailingIconOnClick?: (e: React.MouseEvent) => void;
}

export interface BadgeGroupProps {
  badges: Badge[];
  className?: string;
  badgeClassName?: string;
  badgeSelectedClassName?: string;
  badgeLeadingIconClassName?: string;
  badgeTrailingIconClassName?: string;
  badgeDisabledClassName?: string;
  badgeOnClick?: (e: React.MouseEvent) => void;
  badgeLeadingIconOnClick?: (e: React.MouseEvent) => void;
  badgeTrailingIconOnClick?: (e: React.MouseEvent) => void;
}

export interface Option {
  item: any;
  tag: string;
  type: "searchable" | "selectable";
  className?: string;
  render?: (item: any, tag: string, type: string) => React.ReactNode;
  label?: (item: any) => string;
}

export interface OptionsListProps {
  options: Option[];
  filter?: (item: any, tag: string, type: string) => boolean;
  onSelect?: (item: any, tag: string, type: string) => void;
  onHover?: (item: any, tag: string, type: string) => void;
  className?: string;
  list?: "row" | "column";
  optionClassName?: string;
}
