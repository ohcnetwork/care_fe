import { createRef, useEffect, useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { isAppleDevice } from "../../Utils/utils";
import TextFormField, { TextFormFieldProps } from "./FormFields/TextFormField";

type SearchInputProps = TextFormFieldProps & {
  className?: string | undefined;
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
        debouncePeriod
      );
      return () => clearTimeout(timeoutId);
    }
  }, [value, debouncePeriod, name, onChange, props.value]);

  // Focus hotkey related
  const ref = createRef<HTMLInputElement>();
  useKeyboardShortcut(
    props.hotkey || [isAppleDevice ? "Meta" : "Control", "K"],
    () => !props.secondary && ref.current?.focus(),
    {
      overrideSystem: !props.secondary,
    }
  );

  const shortcutKeyIcon =
    props.hotkeyIcon ||
    (isAppleDevice ? (
      "⌘K"
    ) : (
      <div className="flex font-medium gap-1">
        <span className="text-gray-400">Ctrl</span>
        <span className="text-gray-500">K</span>
      </div>
    ));

  // Escape hotkey to clear related
  useKeyboardShortcut(["Escape"], () => value && setValue(""), {
    ignoreInputFields: false,
  });

  return (
    <TextFormField
      labelClassName="text-sm font-medium"
      {...props}
      name={name}
      errorClassName="hidden"
      reducerProps={undefined}
      validate={undefined}
      type="search"
      ref={ref}
      className={`${className} enabled:bg-white`}
      leading={
        props.leading || (
          <CareIcon className="text-gray-600 p-0.5 mt-1 care-l-search-alt h-5" />
        )
      }
      trailing={
        props.trailing ||
        (!props.secondary && (
          <div className="hidden md:flex absolute inset-y-0 right-0 py-1.5 pr-1.5">
            <kbd className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-gray-500">
              {shortcutKeyIcon}
            </kbd>
          </div>
        ))
      }
      trailingFocused={
        <div className="hidden md:flex absolute inset-y-0 right-0 py-1.5 pr-1.5 gap-1">
          <kbd className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-gray-500">
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
