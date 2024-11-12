import { createRef, useEffect, useState } from "react";
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

const SearchInput = ({
  debouncePeriod = 500,
  className = "w-full md:max-w-sm",
  onChange,
  name = "search",
  ...props
}: SearchInputProps) => {
  // Debounce related
  const [value, setValue] = useState(() => props.value);
  useEffect(() => setValue(props.value), [props.value]);
  useEffect(() => {
    if (value !== props.value) {
      const timeoutId = setTimeout(
        () => onChange && onChange({ name, value: value || "" }),
        debouncePeriod,
      );
      return () => clearTimeout(timeoutId);
    }
  }, [value, debouncePeriod, name, onChange, props.value]);

  // Focus hotkey related
  const ref = createRef<HTMLInputElement>();
  useKeyboardShortcut(
    props.hotkey || [isAppleDevice ? "Meta" : "Control", "K"],
    () => !props.secondary && ref.current?.focus(),
    { overrideSystem: !props.secondary },
  );

  const shortcutKeyIcon =
    props.hotkeyIcon ||
    (isAppleDevice ? (
      "⌘K"
    ) : (
      <div className="flex gap-1 font-medium">
        <span className="text-secondary-400">Ctrl</span>
        <span className="text-secondary-500">K</span>
      </div>
    ));

  // Escape hotkey to clear related
  useKeyboardShortcut(
    ["Escape"],
    () => {
      if (value) {
        setValue("");
      }
      ref.current?.blur();
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
      ref={ref}
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
              {shortcutKeyIcon}
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
};

export default SearchInput;
