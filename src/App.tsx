import { AppUpdateNotifier } from "@/components/Common/AppUpdateNotifier";
import Loading from "@/components/Common/Loading";
import ProductionWarningBanner from "@/components/Common/ProductionWarningBanner";
import { Toaster } from "@/components/ui/sonner";
import { ShortcutProvider } from "@/context/ShortcutContext";
import Integrations from "@/Integrations";
import { OverrideProvider } from "@/lib/override";
import PluginEngine from "@/PluginEngine";
import AuthUserProvider from "@/Providers/AuthUserProvider";
import PublicRouter from "@/Routers/PublicRouter";
import { displayCareConsoleArt } from "@/Utils/consoleArt";
import queryClient from "@/Utils/request/queryClient";
import careConfig from "@careConfig";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useLocationChange } from "raviger";
import { lazy, Suspense, useEffect } from "react";

const PatientRouter = lazy(() => import("@/Routers/PatientRouter"));
const AppRouter = lazy(() => import("@/Routers/AppRouter"));

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
      <ProductionWarningBanner />
      <QueryClientProvider client={queryClient}>
        <ScrollToTop />
        <Suspense fallback={<Loading />}>
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
                theme="light"
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
      </QueryClientProvider>
      <Integrations.Sentry disabled={!import.meta.env.PROD} />
    </>
  );
};

export default App;
