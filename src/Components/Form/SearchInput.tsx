import { createRef, useEffect, useState } from "react";
import useKeyboardShortcut from "use-keyboard-shortcut";
import { isAppleDevice } from "../../Utils/utils";
import TextFormField, { TextFormFieldProps } from "./FormFields/TextFormField";

type SearchInputProps = TextFormFieldProps & {
  className?: string | undefined;
  debouncePeriod?: number;
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

export default function SearchInput({
  debouncePeriod = 500,
  onChange,
  ...props
}: SearchInputProps) {
  // Debounce related
  const [value, setValue] = useState(() => props.value || "");
  useEffect(() => {
    const timeoutId = setTimeout(
      () => onChange && onChange({ name: props.name, value: value || "" }),
      debouncePeriod
    );
    return () => clearTimeout(timeoutId);
  }, [value, debouncePeriod, props.name, onChange]);

  // Focus hotkey related
  const ref = createRef<HTMLInputElement>();
  useKeyboardShortcut(
    props.hotkey || [isAppleDevice ? "Meta" : "Control", "K"],
    () => ref.current?.focus(),
    {
      overrideSystem: true,
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
  useKeyboardShortcut(["Escape"], () => setValue(""), {
    ignoreInputFields: false,
  });

  return (
    <TextFormField
      {...props}
      type="search"
      ref={ref}
      className={`${props.className} enabled:bg-white`}
      leading={
        props.leading || <i className="text-gray-600 uil uil-search-alt" />
      }
      trailing={
        props.trailing || (
          <div className="hidden md:flex absolute inset-y-0 right-0 py-1.5 pr-1.5">
            <kbd className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-gray-500">
              {shortcutKeyIcon}
            </kbd>
          </div>
        )
      }
      trailingFocused={
        <div className="hidden md:flex absolute inset-y-0 right-0 py-1.5 pr-1.5 gap-1">
          <kbd className="inline-flex items-center rounded border border-gray-200 px-2 font-sans text-sm font-medium text-gray-500">
            Esc
          </kbd>
        </div>
      }
      value={value}
      onChange={({ value }) => setValue(value)}
      label=""
      labelClassName="hidden"
      errorClassName="hidden"
      reducerProps={undefined}
      validate={undefined}
    />
  );
}
