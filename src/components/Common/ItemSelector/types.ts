import * as React from "react";

export interface SelectOption<T = any> {
  label: string;
  value: string;
  icon?: React.ReactNode;
  details?: string[];
  disabled?: boolean;
  data?: T; // For storing additional data with the option
}

export interface ItemSelectorProps<T = any> {
  // Selection values
  selection: {
    value?: string | string[] | null;
    onChange: (value: string | string[] | null) => void;
    options: SelectOption<T>[];
    multiSelect?: boolean;
    clearable?: boolean;
  };

  // UI customization
  ui?: {
    title?: string;
    placeholder?: string;
    searchPlaceholder?: string;
    noResultsMessage?: string;
    triggerButton?: React.ReactNode;
    mobileTrigger?: React.ReactNode;
    className?: string;
    disabled?: boolean;
    loading?: boolean;
  };

  // Layout options
  layout?: {
    popoverClassName?: string;
    popoverPosition?: {
      align?: "start" | "center" | "end";
      side?: "top" | "bottom" | "left" | "right";
      sideOffset?: number;
      avoidCollisions?: boolean;
    };
    closeOnSelect?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    hideTrigger?: boolean;
  };

  // Rendering options
  render?: {
    renderOption?: (
      option: SelectOption<T>,
      isSelected: boolean,
    ) => React.ReactNode;
    renderSelection?: (selectedOptions: SelectOption<T>[]) => React.ReactNode;
  };

  // Search handling
  search?: {
    onSearch?: (query: string) => void;
  };

  // Accessibility
  a11y?: {
    "data-cy"?: string;
    "aria-invalid"?: boolean;
  };

  // Shortcut support
  shortcuts?: {
    shortcutId?: string;
    shortcutDisplay?: string;
  };

  // Favorites support
  favorites?: {
    enable?: boolean;
    items?: SelectOption<T>[];
    onToggle?: (item: SelectOption<T>) => void;
    onClearAll?: () => void;
    noItemsMessage?: string;
    layout?: "none" | "tabs" | "sideBySide";
  };
}
