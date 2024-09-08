import { Suspense } from "react";
import Routers from "./Routers";
import ThemedFavicon from "./CAREUI/misc/ThemedFavicon";
import Intergrations from "./Integrations";
import Loading from "./Components/Common/Loading";
import HistoryAPIProvider from "./Providers/HistoryAPIProvider";
import AuthUserProvider from "./Providers/AuthUserProvider";

const App = () => {
   return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
      <HistoryAPIProvider>
        <AuthUserProvider unauthorized={<Routers.SessionRouter />}>
          <Routers.AppRouter />
        </AuthUserProvider>

        {/* Integrations */}
        <Intergrations.Sentry disabled={!import.meta.env.PROD} />
        <Intergrations.Plausible />
      </HistoryAPIProvider>
    </Suspense>
  );
};

export default App;
