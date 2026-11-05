import { AppUpdateNotifier } from "@/components/Common/AppUpdateNotifier";
import Loading from "@/components/Common/Loading";
import ProductionWarningBanner from "@/components/Common/ProductionWarningBanner";
import { Toaster } from "@/components/ui/sonner";
import { AppearanceProvider } from "@/context/AppearanceContext";
import { ShortcutProvider } from "@/context/ShortcutContext";
import Integrations from "@/Integrations";
import { OverrideProvider } from "@/lib/override";
import { withZod } from "@/lib/zodReady";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import { lazyPage } from "@/Routers/lazyPage";
import PublicRouter from "@/Routers/PublicRouter";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";
import careConfig from "@careConfig";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocationChange } from "raviger";
import { Suspense, useEffect } from "react";
import { PubSubProvider } from "./Utils/pubsubContext";

// Both routers render zod forms right away, including for users who sign in
// during this page load, so they wait for zod to be configured.
const PatientRouter = lazyPage(
  withZod(() => import("@/Routers/PatientRouter")),
);
const AppRouter = lazyPage(withZod(() => import("@/Routers/AppRouter")));

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
            <PubSubProvider>
              <ShortcutProvider>
                <PluginEngine>
                  <OverrideProvider>
                    <AuthUserProvider
                      unauthorized={<PublicRouter />}
                      otpAuthorized={
                        <Suspense fallback={<Loading />}>
                          <PatientRouter />
                        </Suspense>
                      }
                    >
                      <Suspense fallback={<Loading />}>
                        <AppRouter />
                      </Suspense>
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
            </PubSubProvider>
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
