import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { FeatureFlagsProvider } from "@/Utils/featureFlags";
import { handleQueryError } from "@/Utils/request/errorHandler";

import { PubSubProvider } from "./Utils/pubsubContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <Suspense fallback={<Loading />}>
        <PubSubProvider>
          <PluginEngine>
            <HistoryAPIProvider>
              <AuthUserProvider unauthorized={<Routers.SessionRouter />}>
                <FeatureFlagsProvider>
                  <Routers.AppRouter />
                </FeatureFlagsProvider>
              </AuthUserProvider>

              {/* Integrations */}
              <Integrations.Sentry disabled={!import.meta.env.PROD} />
              <Integrations.Plausible />
            </HistoryAPIProvider>
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
