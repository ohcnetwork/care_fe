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
import "./i18n";
import "../../style/index.css";

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
          <Intergrations.Sentry
            disabled={process.env.NODE_ENV !== "production"}
          />
          <Intergrations.Plausible />
        </AppConfigProvider>
      </HistoryAPIProvider>
    </Suspense>
  );
};

export default App;
