import careConfig from "@careConfig";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  defaultShouldDehydrateQuery,
  onlineManager,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useLocationChange } from "raviger";
import { Suspense, useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import { handleHttpError } from "@/Utils/request/errorHandler";
import { HTTPError } from "@/Utils/request/types";

import { createUserPersister } from "./OfflineSupport/createUserPersister";
import { PubSubProvider } from "./Utils/pubsubContext";

onlineManager.setEventListener(() => {
  return () => {};
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Only retry network errors or server errors (502, 503, 504) up to 3 times
        if (
          error.message === "Network Error" ||
          (error instanceof HTTPError && [502, 503, 504].includes(error.status))
        ) {
          return failureCount < 3;
        }
        return false;
      },
      gcTime: careConfig.queryGcTime,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
  }),
});

const ScrollToTop = () => {
  useLocationChange(() => {
    window.scrollTo(0, 0);
  });

  return null;
};

const userPersister = createUserPersister();
const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
  }, []);

  return (
    <>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: userPersister,
          maxAge: careConfig.queryPersistMaxAge,
          dehydrateOptions: {
            shouldDehydrateMutation: () => false,
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) &&
              Boolean(query.meta?.persist),
          },
        }}
      >
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <PubSubProvider>
            <PluginEngine>
              <HistoryAPIProvider>
                <AuthUserProvider
                  unauthorized={<Routers.PublicRouter />}
                  otpAuthorized={<Routers.PatientRouter />}
                >
                  <Routers.AppRouter />
                </AuthUserProvider>
              </HistoryAPIProvider>
              <Toaster
                position="top-right"
                theme="light"
                richColors
                expand
                // For `richColors` to work, pass at-least an empty object.
                // Refer: https://github.com/shadcn-ui/ui/issues/2234.
                toastOptions={{ closeButton: true }}
              />
            </PluginEngine>
          </PubSubProvider>
        </Suspense>

        {/* Devtools are not included in production builds by default */}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
