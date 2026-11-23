import { AppUpdateNotifier } from "@/components/Common/AppUpdateNotifier";
import Loading from "@/components/Common/Loading";
import ProductionWarningBanner from "@/components/Common/ProductionWarningBanner";
import { Toaster } from "@/components/ui/sonner";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ShortcutProvider } from "@/context/ShortcutContext";
import Integrations from "@/Integrations";
import { OverrideProvider } from "@/lib/override";
import { useLocationChange } from "@/lib/router/location";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import { router } from "@/router";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";
import careConfig from "@careConfig";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { RouterProvider } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

const ScrollToTop = () => {
  useLocationChange(() => {
    window.scrollTo(0, 0);
  });

  return null;
};

const App = () => {
  useEffect(() => {
    displayCareConsoleArt();
    window.__removeLoadingScreen?.();
  }, []);

  return (
    <>
      <ProductionWarningBanner />
      <QueryClientProvider client={queryClient}>
        <AppearanceProvider>
          <ScrollToTop />
          <Suspense fallback={<Loading />}>
            <ShortcutProvider>
              <PluginEngine>
                <OverrideProvider>
                  {/* Route tree: src/routes/. Route guards read the session
                      from AuthUserProvider through the router context. */}
                  <AuthUserProvider>
                    <RouterProvider router={router} />
                  </AuthUserProvider>
                </OverrideProvider>
                <Toaster
                  position={careConfig.toastPosition}
                  richColors
                  expand
                  // For `richColors` to work, pass at-least an empty object.
                  // Refer: https://github.com/shadcn-ui/ui/issues/2234.
                  toastOptions={{}}
                  closeButton
                />
                <AppUpdateNotifier />
              </PluginEngine>
            </ShortcutProvider>
          </Suspense>

          {/* Devtools are not included in production builds by default */}
          <ReactQueryDevtools initialIsOpen={false} />
        </AppearanceProvider>
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
