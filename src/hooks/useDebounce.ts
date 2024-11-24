import { useEffect, useRef, useState } from "react";

/**
 * Custom hook to debounce a value.
 *
 * @param {any} value - The value to debounce.
 * @param {number} delay - The debounce delay in milliseconds.
 * @returns {any} - The debounced value.
 */
const useDebounce = (value: string, delay: number) => {
  function compareObjects(obj1: string, obj2: string) {
    obj1 = JSON.parse(obj1);
    obj2 = JSON.parse(obj2);
    const entries1 = Object.entries(obj1).map(([key, value]) => [
      key,
      String(value),
    ]);
    const entries2 = Object.entries(obj2).map(([key, value]) => [
      key,
      String(value),
    ]);
    entries1.sort(([key1], [key2]) => key1.localeCompare(key2));
    entries2.sort(([key1], [key2]) => key1.localeCompare(key2));

    return JSON.stringify(entries1) === JSON.stringify(entries2);
  }

  const [debouncedValue, setDebouncedValue] = useState(value);
  const previousValueRef = useRef(value);
  console.log(value);
  useEffect(() => {
    if (compareObjects(previousValueRef.current, value)) {
      return;
    }

    const handler = setTimeout(() => {
      setDebouncedValue(value);
      previousValueRef.current = value;
    }, delay);

    // Cleanup the timeout if the value changes or the component unmounts
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default useDebounce;
