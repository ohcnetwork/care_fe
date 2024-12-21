import React from "react";

import useDebounce from "@/hooks/useDebounce";

/**
 * Similar to `useState` but with a debounced setter.
 *
 * @param value - The initial value.
 * @param delay - The delay in milliseconds.
 * @returns A tuple containing the current state and a debounced setter.
 */
export default function useDebouncedState<T>(value: T, delay: number) {
  const [state, _setState] = React.useState(value);
  const setState = useDebounce(_setState, delay);
  return [state, setState] as const;
}
