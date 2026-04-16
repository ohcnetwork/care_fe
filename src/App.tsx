import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocationChange } from "raviger";
import { Suspense, useEffect } from "react";

import { Toaster } from "@/components/ui/sonner";

import { AppUpdateNotifier } from "@/components/Common/AppUpdateNotifier";
import Loading from "@/components/Common/Loading";
import ProductionWarningBanner from "@/components/Common/ProductionWarningBanner";

import Integrations from "@/Integrations";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import { ContrastProvider } from "@/Providers/ContrastProvider";
import { FontSizeProvider } from "@/Providers/FontSizeProvider";
import HistoryAPIProvider from "@/Providers/HistoryAPIProvider";
import { ThemeProvider, useTheme } from "@/Providers/ThemeProvider";
import Routers from "@/Routers";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";

import { ShortcutProvider } from "@/context/ShortcutContext";
import { PubSubProvider } from "./Utils/pubsubContext";

const ScrollToTop = () => {
  useLocationChange(() => {
    window.scrollTo(0, 0);
  });

  return null;
};

function ThemedToaster() {
  const { theme } = useTheme();
  const resolvedTheme =
    theme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme.startsWith("dark")
        ? "dark"
        : "light";

  return (
    <Toaster
      position="top-center"
      theme={resolvedTheme}
      richColors
      expand
      // For `richColors` to work, pass at-least an empty object.
      // Refer: https://github.com/shadcn-ui/ui/issues/2234.
      toastOptions={{}}
      closeButton
    />
  );
}

const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
  }, []);

  return (
    <>
      <ProductionWarningBanner />
      <QueryClientProvider client={queryClient}>
        <FontSizeProvider>
          <ContrastProvider>
            <ThemeProvider>
              <ScrollToTop />
              <Suspense fallback={<Loading />}>
                <PubSubProvider>
                  <ShortcutProvider>
                    <HistoryAPIProvider>
                      <AuthUserProvider
                        unauthorized={<Routers.PublicRouter />}
                        otpAuthorized={<Routers.PatientRouter />}
                      >
                        <PluginEngine>
                          <Routers.AppRouter />
                        </PluginEngine>
                      </AuthUserProvider>
                    </HistoryAPIProvider>
                    <ThemedToaster />
                    <AppUpdateNotifier />
                  </ShortcutProvider>
                </PubSubProvider>
              </Suspense>
            </ThemeProvider>
          </ContrastProvider>
        </FontSizeProvider>

        {/* Devtools are not included in production builds by default */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
