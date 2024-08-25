"use client";

import { Suspense } from "react";
import Routers from "../Routers";
import {
  AppConfigProvider,
  AuthUserProvider,
  HistoryAPIProvider,
} from "../Providers";
import ThemedFavicon from "../CAREUI/misc/ThemedFavicon";
import Loading from "../Components/Common/Loading";
import "../i18n";
import "../style/index.css";

const App = ({ children }: { children: React.ReactNode }) => {
  return (
    <Suspense fallback={<Loading />}>
      <ThemedFavicon />
      <HistoryAPIProvider>
        <AppConfigProvider>
          <AuthUserProvider unauthorized={<Routers.SessionRouter />}>
            {children}
          </AuthUserProvider>
        </AppConfigProvider>
      </HistoryAPIProvider>
    </Suspense>
  );
};

export default App;
