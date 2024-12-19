import React, { forwardRef, useEffect, useRef, useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";

import CareIcon from "@/CAREUI/icons/CareIcon";

import TextFormField, {
  TextFormFieldProps,
} from "@/components/Form/FormFields/TextFormField";

import { isAppleDevice } from "@/Utils/utils";

type SearchInputProps = TextFormFieldProps & {
  debouncePeriod?: number;
  secondary?: true | undefined;
} & (
    | {
        hotkey: string[];
        hotkeyIcon: React.ReactNode;
      }
    | {
        hotkey?: undefined;
        hotkeyIcon?: undefined;
      }
  );

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      debouncePeriod = 500,
      className = "w-full md:max-w-sm",
      onChange,
      name = "search",
      ...props
    }: SearchInputProps,
    ref,
  ) => {
    // Debounce related
    const [value, setValue] = useState(() => props.value);
    const internalRef = useRef<HTMLInputElement>(null);
    const inputRef = (ref || internalRef) as React.RefObject<HTMLInputElement>;
    useEffect(() => setValue(props.value), [props.value]);

    useEffect(() => {
      if (value !== props.value) {
        const timeoutId = setTimeout(() => {
          onChange && onChange({ name, value: value || "" });
        }, debouncePeriod);

        return () => clearTimeout(timeoutId);
      }
    }, [value, debouncePeriod, name, onChange, props.value]);

    // Focus shortcut logic
    useKeyboardShortcut(
      props.hotkey || [isAppleDevice ? "Meta" : "Control", "K"],
      () => {
        if (!props.secondary) {
          inputRef.current?.focus();
        }
      },
      { overrideSystem: !props.secondary },
    );

    // Clear input and blur on `Escape` key
    useKeyboardShortcut(
      ["Escape"],
      () => {
        if (value) {
          setValue("");
        }
        inputRef.current?.blur();
      },
      {
        ignoreInputFields: false,
      },
    );

    return (
      <TextFormField
        labelClassName="font-medium"
        {...props}
        name={name}
        errorClassName="hidden"
        type="search"
        ref={inputRef}
        className={className}
        leading={
          props.leading || (
            <CareIcon icon="l-search-alt" className="text-secondary-600 z-10" />
          )
        }
        trailing={
          props.trailing ||
          (!props.secondary && (
            <div className="absolute inset-y-0 right-0 hidden py-1.5 pr-1.5 md:flex">
              <kbd className="inline-flex items-center rounded border border-secondary-200 bg-white px-2 font-sans text-sm font-medium text-secondary-500 focus:opacity-0">
                {props.hotkeyIcon || (isAppleDevice ? "⌘K" : "Ctrl+K")}
              </kbd>
            </div>
          ))
        }
        trailingFocused={
          <div className="absolute inset-y-0 right-0 hidden gap-1 py-1.5 pr-1.5 md:flex">
            <kbd className="inline-flex items-center rounded border border-secondary-200 bg-white px-2 font-sans text-sm font-medium text-secondary-500">
              Esc
            </kbd>
          </div>
        }
        value={value || ""}
        onChange={({ value }) => setValue(value)}
      />
    );
  },
);

export default SearchInput;
