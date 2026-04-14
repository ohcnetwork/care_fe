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
  if (!registry.has(key)) {
    registry.set(key, { value: initialValue, listeners: new Set() });
  }
  return registry.get(key) as ControlStore<T>;
}

/**
 * A shared state hook that works like `useState` but stores state in a global
 * registry accessible by both the host app and MFE plugins.
 *
 * Both sides subscribe to changes via `useSyncExternalStore`, so updates
 * from either side trigger re-renders on both.
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

  const value = useSyncExternalStore(subscribe, getSnapshot);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (prev: T) => T)(store.value)
          : action;
      if (!Object.is(nextValue, store.value)) {
        store.value = nextValue;
        store.listeners.forEach((l) => l());
      }
    },
    [store],
  );

  return [value, setValue];
}

/**
 * Write-only variant of `useControlState`. Returns only the setter without
 * subscribing to value changes — the component won't re-render when the
 * store value changes. Use this in MFE plugins that only need to push
 * data into the shared store (e.g. transcription results).
 */
export function useControlStateSetter<T>(
  key: string,
  initialValue: T,
): Dispatch<SetStateAction<T>> {
  const store = getOrCreateStore(key, initialValue);

  return useCallback(
    (action) => {
      const nextValue =
        typeof action === "function"
          ? (action as (prev: T) => T)(store.value)
          : action;
      if (!Object.is(nextValue, store.value)) {
        store.value = nextValue;
        store.listeners.forEach((l) => l());
      }
    },
    [store],
  );
}
