import careConfig from "@careConfig";
import {
  defaultShouldDehydrateQuery,
  onlineManager,
} from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useLocationChange } from "raviger";
import { Suspense, useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";

import Loading from "@/components/Common/Loading";
import { SyncBannerWrapper } from "@/components/Common/SyncBannerWrapper";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";
import { SyncProvider } from "@/context/SyncContext";

import { createUserPersister } from "./OfflineSupport/createUserPersister";
import { PubSubProvider } from "./Utils/pubsubContext";

onlineManager.setEventListener(() => {
  return () => {};
});

const ScrollToTop = () => {
  useLocationChange(() => {
    window.scrollTo(0, 0);
  });

  return null;
};

const userPersister = createUserPersister();
const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
  }, []);

  return (
    <>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: userPersister,
          maxAge: careConfig.queryPersistMaxAge,
          dehydrateOptions: {
            shouldDehydrateMutation: () => false,
            shouldDehydrateQuery: (query) =>
              defaultShouldDehydrateQuery(query) &&
              Boolean(query.meta?.persist),
          },
        }}
      >
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <PubSubProvider>
            <PluginEngine>
              <SyncProvider>
                <HistoryAPIProvider>
                  <AuthUserProvider
                    unauthorized={<Routers.PublicRouter />}
                    otpAuthorized={<Routers.PatientRouter />}
                  >
                    <Routers.AppRouter />
                  </AuthUserProvider>
                </HistoryAPIProvider>
                <SyncBannerWrapper />
                <Toaster
                  position="top-right"
                  theme="light"
                  richColors
                  expand
                  // For `richColors` to work, pass at-least an empty object.
                  // Refer: https://github.com/shadcn-ui/ui/issues/2234.
                  toastOptions={{ closeButton: true }}
                />
              </SyncProvider>
            </PluginEngine>
          </PubSubProvider>
        </Suspense>

        {/* Devtools are not included in production builds by default */}
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
