import "@/style/index.css";
import "reactflow/dist/style.css";

import * as Sentry from "@sentry/browser";

import App from "@/App";
import { AuthContextType, AuthUserContext } from "@/hooks/useAuthUser";
import { initI18n } from "@/i18n";
import { PlugConfigMeta } from "@/types/plugConfig";
import careConfig from "@careConfig";
import React, { Context } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";

// Extend Window interface to include CARE_API_URL
declare global {
  interface Window {
    CARE_API_URL: string;
    __CORE_ENV__: typeof careConfig;
    __CARE_PLUGIN_RUNTIME__: { meta: PlugConfigMeta };
    AuthUserContext: Context<AuthContextType | null>;
  }
}

// Expose Environment variable to window object for use in plugins
window.CARE_API_URL = careConfig.apiUrl;
window.AuthUserContext = AuthUserContext;
window.__CORE_ENV__ = careConfig;

if ("serviceWorker" in navigator) {
  registerSW({ immediate: false });
}

if (import.meta.env.PROD) {
  Sentry.init({
    environment: import.meta.env.MODE,
    dsn: "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
  });
}

// Initialize i18n with namespaces from API before rendering the app
initI18n()
  .then(() => {
    const root = createRoot(document.getElementById("root") as HTMLElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  })
  .catch((error) => {
    console.error("Failed to initialize i18n:", error);
    // Still render the app even if i18n initialization fails
    const root = createRoot(document.getElementById("root") as HTMLElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
