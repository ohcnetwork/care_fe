import { useState, Suspense } from "react";
import Routers from "./Routers";
import ThemedFavicon from "./CAREUI/misc/ThemedFavicon";
import Intergrations from "./Integrations";
import Loading from "./Components/Common/Loading";
import HistoryAPIProvider from "./Providers/HistoryAPIProvider";
import AuthUserProvider from "./Providers/AuthUserProvider";
import PluginEngine from "./PluginEngine";
import { PluginConfigType } from "./Common/hooks/useConfig";

const App = () => {
  const [plugins, setPlugins] = useState<PluginConfigType[]>(["care-livekit"]);
  return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
      <PluginEngine plugins={plugins} setPlugins={setPlugins}>
        <HistoryAPIProvider>
          <AuthUserProvider unauthorized={<Routers.SessionRouter />}>
            <Routers.AppRouter />
          </AuthUserProvider>

          {/* Integrations */}
          <Intergrations.Sentry disabled={!import.meta.env.PROD} />
          <Intergrations.Plausible />
        </HistoryAPIProvider>
      </PluginEngine>
    </Suspense>
  );
};

export default App;
