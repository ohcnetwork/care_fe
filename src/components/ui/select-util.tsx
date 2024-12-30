import { useCallback, useState } from "react";

import { useValueInjection } from "@/Utils/useValueInjectionObserver";

import {
  SelectContent,
  SelectItem,
  Select as SelectStandalone,
  SelectTrigger,
  SelectValue,
} from "./select";

export default function Select(props: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  options: {
    label: React.ReactNode;
    value: string;
  }[];
  disabled?: boolean;
}) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const callbackRef = useCallback(
    (node: HTMLElement | null) => setElement(node),
    [],
  );

  useValueInjection<string>({
    targetElement: element,
    attribute: "data-cui-listbox-value",
    onChange: (value) => value && props.onChange(value),
  });

  return (
    <SelectStandalone
      value={props.value}
      onValueChange={props.onChange}
      disabled={props.disabled}
    >
      <SelectTrigger
        ref={callbackRef}
        data-cui-listbox
        data-cui-listbox-options={JSON.stringify(
          props.options.map((option) => [
            option.value,
            option.label?.toString(),
          ]),
        )}
        data-cui-listbox-value={JSON.stringify(props.value)}
      >
        <SelectValue placeholder={props.placeholder} />
      </SelectTrigger>
      <SelectContent>
        {props.options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </SelectStandalone>
  );
}
