import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * A global store registry shared between the host app and MFE plugins
 * via `window.__CARE_CONTROL_STORES__`.
 */
interface ControlStore<T = unknown> {
  value: T;
  listeners: Set<() => void>;
}

type StoreRegistry = Map<string, ControlStore>;

function getRegistry(): StoreRegistry {
  if (!window.__CARE_CONTROL_STORES__) {
    window.__CARE_CONTROL_STORES__ = new Map();
  }
  return window.__CARE_CONTROL_STORES__;
}

function getOrCreateStore<T>(key: string, initialValue: T): ControlStore<T> {
  const registry = getRegistry();
  if (!registry.has(key)) {
    registry.set(key, { value: initialValue, listeners: new Set() });
  }
  return registry.get(key) as ControlStore<T>;
}

/**
 * A shared state hook that works like `useState` but stores state in a global
 * registry accessible by both the host app and MFE plugins.
 *
 * Uses local `useState` for fast rendering (batchable by React) while keeping
 * the global store in sync. External changes (e.g. from MFE plugins) are
 * detected via the store's listener mechanism and synced to local state.
 *
 * @param key - A unique key identifying this piece of shared state.
 * @param initialValue - The initial value (used only on first access).
 */
export function useControlState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const store = getOrCreateStore(key, initialValue);
  const [localValue, setLocalValue] = useState<T>(store.value);
  const isLocalUpdate = useRef(false);

  // Subscribe to external store changes (from plugins or other consumers)
  useEffect(() => {
    const listener = () => {
      if (isLocalUpdate.current) {
        isLocalUpdate.current = false;
        return;
      }
      setLocalValue(store.value);
    };
    store.listeners.add(listener);
    return () => {
      store.listeners.delete(listener);
    };
  }, [store]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (prev: T) => T)(store.value)
          : action;
      if (!Object.is(nextValue, store.value)) {
        isLocalUpdate.current = true;
        store.value = nextValue;
        setLocalValue(nextValue);
        store.listeners.forEach((l) => l());
      }
    },
    [store],
  );

  return [localValue, setValue];
}
