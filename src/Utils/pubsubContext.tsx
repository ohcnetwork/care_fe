import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
} from "react";

export type Handler = (message: unknown) => Promise<void>;
type PubSubContextType = {
  subscribe: (topic: string, handler: Handler) => void;
  unsubscribe: (topic: string, handler: Handler) => void;
  publish: (topic: string, message: unknown) => void;
};

const PubSubContext = createContext<PubSubContextType | null>(null);

export const PubSubProvider = ({ children }: { children: React.ReactNode }) => {
  const subscribersRef = useRef<Record<string, Set<Handler>>>({});

  const subscribe = useCallback((topic: string, handler: Handler) => {
    const handlers = subscribersRef.current[topic];

    if (handlers) {
      handlers.add(handler);
      return;
    }

    subscribersRef.current[topic] = new Set([handler]);
  }, []);

  const unsubscribe = useCallback((topic: string, handler: Handler) => {
    const handlers = subscribersRef.current[topic];
    if (!handlers) {
      return;
    }

    handlers.delete(handler);

    if (handlers.size === 0) {
      delete subscribersRef.current[topic];
    }
  }, []);

  const publish = useCallback((topic: string, message: unknown) => {
    const handlers = subscribersRef.current[topic];
    if (!handlers) {
      return;
    }

    handlers.forEach(async (handler) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Handler failed for topic ${topic}:`, error);
      }
    });
  }, []);

  const value = useMemo(
    () => ({ subscribe, unsubscribe, publish }),
    [publish, subscribe, unsubscribe],
  );

  return <PubSubContext.Provider value={value}>{children}</PubSubContext.Provider>;
};

export const usePubSub = () => {
  const context = useContext(PubSubContext);

  if (!context) {
    throw new Error("usePubSub must be used within PubSubProvider");
  }

  return context;
};
