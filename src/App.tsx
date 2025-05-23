import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
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

import { PubSubProvider } from "./Utils/pubsubContext";
import { NetworkStatusProvider } from "./offlinesupport/Offlinestatusprovider";
import { createUserPersister } from "./offlinesupport/dexiepersister";

export const queryClient = new QueryClient({
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
      refetchOnWindowFocus: false,
      gcTime: 2000 * 60 * 60 * 24 * 7, // 48 hr
    },
  },
  queryCache: new QueryCache({
    onError: handleHttpError,
  }),
  mutationCache: new MutationCache({
    onError: handleHttpError,
  }),
});

const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
  }, []);

  return (
    <>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: createUserPersister(),
          maxAge: 1000 * 60 * 60 * 24 * 7, // 24 hr cache
        }}
      >
        <Suspense fallback={<Loading />}>
          <PubSubProvider>
            <PluginEngine>
              <HistoryAPIProvider>
                <NetworkStatusProvider>
                  <AuthUserProvider
                    unauthorized={<Routers.PublicRouter />}
                    otpAuthorized={<Routers.PatientRouter />}
                  >
                    <Routers.AppRouter />
                  </AuthUserProvider>
                </NetworkStatusProvider>
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
