import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { handleHttpError } from "@/Utils/request/errorHandler";
import { HTTPError } from "@/Utils/request/types";

import { PubSubProvider } from "./Utils/pubsubContext";

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
      refetchOnWindowFocus: false,
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
  return (
    <>
      <QueryClientProvider client={queryClient}>
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
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
