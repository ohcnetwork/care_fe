import { createContext, useContext, useState } from "react";

export type Handler = (message: unknown) => Promise<void>;
export type _PubSubContext = {
  subscribe: (topic: string, handler: Handler) => void;
  unsubscribe: (topic: string, handler: Handler) => void;
  publish: (topic: string, message: unknown) => void;
  subscribers: Record<string, Set<Handler>>;
  setSubscribers: React.Dispatch<
    React.SetStateAction<Record<string, Set<Handler>>>
  >;
};

const PubSubContext = createContext<_PubSubContext | null>(null);

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

      const newHandlers = new Set(handlers);
      newHandlers.delete(handler);

      if (newHandlers.size === 0) {
        const { [topic]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [topic]: newHandlers,
      };
    });
  };

  const publish = (topic: string, message: unknown) => {
    if (!subscribers[topic]) {
      return;
    }

    subscribers[topic].forEach(async (handler) => {
      try {
        await handler(message);
      } catch (error) {
        console.error(`Handler failed for topic ${topic}:`, error);
      }
    });
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
