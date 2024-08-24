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
import BrowserWarning from "./BrowserWarning";
const App = () => {

  return (
    <>
    <BrowserWarning/>
    <Suspense fallback={<Loading />}>
      <BrowserWarning/>
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
    </>
  );
};

export default App;
