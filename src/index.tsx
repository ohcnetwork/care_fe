import "@/style/index.css";

import App from "@/App";
import { AuthContextType, AuthUserContext } from "@/hooks/useAuthUser";
import { initI18n } from "@/i18n";
import { PlugConfigMeta } from "@/types/plugConfig";
import careConfig from "@careConfig";
import React, { Context } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

import { LocalStorageKeys } from "@/common/constants";

// Extend Window interface to include CARE_API_URL
declare global {
  interface Window {
    CARE_API_URL: string;
    __CORE_ENV__: typeof careConfig;
    __CARE_PLUGIN_RUNTIME__: { meta: PlugConfigMeta };
    AuthUserContext: Context<AuthContextType | null>;
    // Provided by public/loading-screen.js until the pre-React screen is removed
    __removeLoadingScreen?: (options?: { immediate?: boolean }) => void;
    __holdLoadingScreen?: () => () => void;
  }
}

// Expose Environment variable to window object for use in plugins
window.CARE_API_URL = careConfig.apiUrl;
window.AuthUserContext = AuthUserContext;
window.__CORE_ENV__ = careConfig;

if ("serviceWorker" in navigator) {
  registerSW({ immediate: false });
}

function initApp() {
  const container = document.getElementById("root");

  if (!container) {
    throw new Error("Root container not found");
  }

  const root = createRoot(container);

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

// zod is not needed to render the sign-in pages, so it is configured from its
// own chunk. Signed-in views use zod right away, so only they wait for it.
const zodReady = import("./lib/zod")
  .then(({ initZod }) => initZod())
  .catch((error) => {
    console.error("Failed to configure zod:", error);
  });
const isSignedIn =
  !!localStorage.getItem(LocalStorageKeys.accessToken) ||
  !!localStorage.getItem(LocalStorageKeys.patientTokenKey);

// Initialize i18n with namespaces from API before rendering the app
Promise.all([
  initI18n().catch((error) => {
    console.error("Failed to initialize i18n:", error);
  }),
  isSignedIn ? zodReady : undefined,
]).finally(initApp);
