import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from "react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { FeatureFlagsProvider } from "@/Utils/featureFlags";
import { handleHttpError } from "@/Utils/request/errorHandler";

import { PubSubProvider } from "./Utils/pubsubContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
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
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loading />}>
        <PubSubProvider>
          <PluginEngine>
            <HistoryAPIProvider>
              <AuthUserProvider
                unauthorized={<Routers.PublicRouter />}
                otpAuthorized={<Routers.PatientRouter />}
              >
                <FeatureFlagsProvider>
                  <Routers.AppRouter />
                </FeatureFlagsProvider>
              </AuthUserProvider>

              {/* Integrations */}
              <Integrations.Sentry disabled={!import.meta.env.PROD} />
            </HistoryAPIProvider>
            <Sonner
              position="top-right"
              theme="light"
              richColors
              expand
              // For `richColors` to work, pass at-least an empty object.
              // Refer: https://github.com/shadcn-ui/ui/issues/2234.
              toastOptions={{ closeButton: true }}
            />
            <Toaster />
          </PluginEngine>
        </PubSubProvider>
      </Suspense>

      {/* Devtools are not included in production builds by default */}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};

export default App;
