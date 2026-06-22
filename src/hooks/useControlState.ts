import {
  Dispatch,
  SetStateAction,
  useCallback,
  useSyncExternalStore,
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
  let store = registry.get(key) as ControlStore<T> | undefined;
  if (!store) {
    store = { value: initialValue, listeners: new Set() };
    registry.set(key, store);
  }
  return store;
}

/**
 * A shared state hook that works like `useState` but stores state in a global
 * registry accessible by both the host app and MFE plugins.
 *
 * @param key - A unique key identifying this piece of shared state.
 * @param initialValue - The initial value (used only on first access).
 */
export function useControlState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const store = getOrCreateStore(key, initialValue);

  const subscribe = useCallback(
    (listener: () => void) => {
      store.listeners.add(listener);
      return () => {
        store.listeners.delete(listener);
      };
    },
    [store],
  );

  const getSnapshot = useCallback(() => store.value, [store]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (prev: T) => T)(store.value)
          : action;
      if (!Object.is(nextValue, store.value)) {
        store.value = nextValue;
        // Snapshot to avoid mutation-during-iteration if a listener
        // synchronously (un)mounts another consumer of the same key.
        Array.from(store.listeners).forEach((l) => l());
      }
    },
    [store],
  );

  return [value, setValue];
}
