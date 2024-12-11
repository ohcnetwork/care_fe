import { useEffect, useRef } from "react";

export default function useDebounce<T extends any[]>(
  callback: (...args: T) => void,
  delay: number,
) {
  const callbackRef = useRef(callback);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const debouncedCallback = (...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callbackRef.current(...args);
    }, delay);
  };
  return debouncedCallback;
}
