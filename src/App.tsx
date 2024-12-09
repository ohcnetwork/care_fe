import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense } from "react";

import { Toaster } from "@/components/ui/sonner";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { FeatureFlagsProvider } from "@/Utils/featureFlags";

import { PubSubProvider } from "./Utils/pubsubContext";

const queryClient = new QueryClient();

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <QueryClientProvider client={queryClient}>
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
          </PluginEngine>
        </PubSubProvider>
        <Toaster
          position="top-right"
          theme="light"
          richColors
          // Voluntarily passing empty object as a workaround for `richColors`
          // to work. Refer: https://github.com/shadcn-ui/ui/issues/2234.
          toastOptions={{}}
        />
      </QueryClientProvider>
    </Suspense>
  );
};

export default App;
