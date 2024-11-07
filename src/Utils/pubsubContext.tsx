import { createContext, useContext, useState } from "react";

export type Handler = (message: unknown) => Promise<void>;
export type PubSubContext = {
  subscribe: (topic: string, handler: Handler) => void;
  unsubscribe: (topic: string, handler: Handler) => void;
  publish: (topic: string, message: unknown) => void;
  subscribers: Record<string, Set<Handler>>;
  setSubscribers: React.Dispatch<
    React.SetStateAction<Record<string, Set<Handler>>>
  >;
};

const PubSubContext = createContext<PubSubContext | null>(null);

export const PubSubProvider = ({ children }: { children: React.ReactNode }) => {
  const [subscribers, setSubscribers] = useState<Record<string, Set<Handler>>>(
    {},
  );

  const subscribe = (topic: string, handler: Handler) => {
    setSubscribers((prev) => ({
      ...prev,
      [topic]: new Set([...(prev[topic] || []), handler]),
    }));
  };

  const unsubscribe = (topic: string, handler: Handler) => {
    setSubscribers((prev) => {
      const handlers = prev[topic];

      if (!handlers) {
        return prev;
      }

      handlers.delete(handler);

      if (handlers.size === 0) {
        delete prev[topic];
      }

      return { ...prev };
    });
  };

  const publish = (topic: string, message: unknown) => {
    if (!subscribers[topic]) {
      return;
    }

    subscribers[topic].forEach(async (handler) => await handler(message));
  };

  return (
    <PubSubContext.Provider
      value={{ subscribe, unsubscribe, publish, subscribers, setSubscribers }}
    >
      {children}
    </PubSubContext.Provider>
  );
};

export const usePubSub = () => {
  const context = useContext(PubSubContext);

  if (!context) {
    throw new Error("usePubSub must be used within PubSubProvider");
  }

  return context;
};
