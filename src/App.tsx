import { Suspense } from "react";
import Routers from "./Routers";
import {
  AppConfigProvider,
  AuthUserProvider,
  HistoryAPIProvider,
} from "./Providers";
import ThemedFavicon from "./CAREUI/misc/ThemedFavicon";
import Intergrations from "./Integrations";
import Loading from "./Components/Common/Loading";
import QueryCacheProvider from "./Utils/request/QueryCacheProvider";

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
      <QueryCacheProvider>
        <HistoryAPIProvider>
          <AppConfigProvider>
            <AuthUserProvider unauthorized={<Routers.SessionRouter />}>
              <Routers.AppRouter />
            </AuthUserProvider>
            {/* Integrations */}
            <Intergrations.Sentry disabled={!import.meta.env.PROD} />
            <Intergrations.Plausible />
          </AppConfigProvider>
        </HistoryAPIProvider>
      </QueryCacheProvider>
    </Suspense>
  );
};

export default App;
