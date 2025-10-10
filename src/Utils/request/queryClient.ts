import {
  MutationCache,
  QueryCache,
  QueryClient,
  hydrate,
  onlineManager,
} from "@tanstack/react-query";
import i18next from "i18next";
import { toast } from "sonner";

import { createUserPersister } from "@/OfflineSupport/createUserPersister";
import { handleHttpError } from "@/Utils/request/errorHandler";
import { HTTPError } from "@/Utils/request/types";
import careConfig from "@careConfig";

interface QueryMeta extends Record<string, unknown> {
  persist?: boolean;
}

declare module "@tanstack/react-query" {
  interface Register {
    defaultError: HTTPError;
    queryMeta: QueryMeta;
  }
}

// Cache restoration function
const restorePersistedCache = async (queryClient: QueryClient) => {
  const persistor = createUserPersister();
  if (!persistor) return;

  try {
    const restored = await persistor.restoreClient();
    if (restored?.clientState) {
      queryClient.clear();
      hydrate(queryClient, restored.clientState);
    }
  } catch (error) {
    console.error("Failed to restore cache:", error);
  }
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Only retry network errors or server errors (502, 503, 504) up to 3 times
        if (
          error.message === "Network Error" ||
          (error instanceof HTTPError && [502, 503, 504].includes(error.status))
        ) {
          if (onlineManager.isOnline()) {
            toast.warning(i18next.t("you_are_offline"));
          }
          onlineManager.setOnline(false);
          return failureCount < 3;
        }
        return false;
      },
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      gcTime: careConfig.queryGcTime,
    },
  },
  queryCache: new QueryCache({
    onError: async (error) => {
      if (error.message !== "Network Error") {
        handleHttpError(error);
        return;
      }
      if (onlineManager.isOnline()) {
        toast.warning(i18next.t("you_are_offline"));
      }
      onlineManager.setOnline(false);
      await restorePersistedCache(queryClient);
    },
  }),
  mutationCache: new MutationCache({
    onError: async (error) => {
      if (error.message !== "Network Error") {
        handleHttpError(error);
        return;
      }

      if (onlineManager.isOnline()) {
        toast.warning(i18next.t("you_are_offline"));
      }
      onlineManager.setOnline(false);
      await restorePersistedCache(queryClient);
    },
    onSuccess: async () => {
      if (!onlineManager.isOnline()) {
        toast.success(i18next.t("welcome_back_you_are_online"));
      }
      onlineManager.setOnline(true);
    },
  }),
});

export default queryClient;
