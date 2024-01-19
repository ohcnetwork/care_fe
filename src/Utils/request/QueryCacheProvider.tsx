import { ReactNode, createContext, useContext, useRef } from "react";

type QueryCacheAPI = {
  get: (key: string) => unknown;
  set: (key: string, value: unknown) => void;
};

const queryCacheContext = createContext<QueryCacheAPI | undefined>(undefined);

export default function QueryCacheProvider(props: { children: ReactNode }) {
  const cacheRef = useRef<Record<string, unknown>>({});

  return (
    <queryCacheContext.Provider
      value={{
        get: (key) => cacheRef.current[key],
        set: (key, value) => (cacheRef.current[key] = value),
      }}
    >
      {props.children}
    </queryCacheContext.Provider>
  );
}

export const useQueryCache = () => {
  const queryCache = useContext(queryCacheContext);
  if (queryCache === undefined) {
    throw "useQueryCache should be used inside QueryCacheProvider";
  }
  return queryCache;
};
