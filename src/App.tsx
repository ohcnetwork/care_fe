import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocationChange } from "raviger";
import { Suspense, useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";

import Loading from "@/components/Common/Loading";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import Routers from "@/Routers";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";

import { PubSubProvider } from "./Utils/pubsubContext";

const ScrollToTop = () => {
  useLocationChange(() => {
    window.scrollTo(0, 0);
  });

  return null;
};

const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
  }, []);

  return (
    <>
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
          <PubSubProvider>
            <PluginEngine>
              <HistoryAPIProvider>
                <AuthUserProvider
                  unauthorized={<Routers.PublicRouter />}
                  otpAuthorized={<Routers.PatientRouter />}
                >
                  <Routers.AppRouter />
                </AuthUserProvider>
              </HistoryAPIProvider>
              <Toaster
                position="top-right"
                theme="light"
                richColors
                expand
                // For `richColors` to work, pass at-least an empty object.
                // Refer: https://github.com/shadcn-ui/ui/issues/2234.
                toastOptions={{ closeButton: true }}
              />
            </PluginEngine>
          </PubSubProvider>
        </Suspense>

        {/* Devtools are not included in production builds by default */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
