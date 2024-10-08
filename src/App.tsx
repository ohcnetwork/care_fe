import { useState, Suspense } from "react";
import Routers from "./Routers";
import ThemedFavicon from "./CAREUI/misc/ThemedFavicon";
import Integrations from "./Integrations";
import Loading from "./Components/Common/Loading";
import HistoryAPIProvider from "./Providers/HistoryAPIProvider";
import AuthUserProvider from "./Providers/AuthUserProvider";
import PluginEngine from "./PluginEngine";
import { PluginConfigType } from "./Common/hooks/useConfig";
import { FeatureFlagsProvider } from "./Utils/featureFlags";

const App = () => {
  const [plugins, setPlugins] = useState<PluginConfigType[]>(["care-livekit"]);
  return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
      <PluginEngine plugins={plugins} setPlugins={setPlugins}>
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
    </Suspense>
  );
};

export default App;
