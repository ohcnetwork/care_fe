import { Suspense } from "react";

import { Toaster } from "@/components/ui/toaster";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { FeatureFlagsProvider } from "@/Utils/featureFlags";

import { PubSubProvider } from "./Utils/pubsubContext";

const App = () => {
  return (
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
  );
};

export default App;
