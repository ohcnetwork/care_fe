import { Suspense } from "react";

import ThemedFavicon from "@/CAREUI/misc/ThemedFavicon";
import Loading from "@/Components/Common/Loading";
import Intergrations from "@/Integrations";
import {
  AppConfigProvider,
  AuthUserProvider,
  HistoryAPIProvider,
} from "@/Providers";
import Routers from "@/Routers";

const App = () => {
  return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
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
    </Suspense>
  );
};

export default App;
