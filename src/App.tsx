import { Suspense } from "react";
import Routers from "./Routers";
import Integrations from "./Integrations";
import Loading from "@/components/Common/Loading";
import HistoryAPIProvider from "./Providers/HistoryAPIProvider";
import AuthUserProvider from "./Providers/AuthUserProvider";
import PluginEngine from "./PluginEngine";
import { FeatureFlagsProvider } from "./Utils/featureFlags";
import { Toaster } from "@/components/ui/toaster";
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
