import "@/style/index.css";
import "reactflow/dist/style.css";

import App from "@/App";
import { AuthContextType, AuthUserContext } from "@/hooks/useAuthUser";
import { initI18n } from "@/i18n";
import { PlugConfigMeta } from "@/types/plugConfig";
import careConfig from "@careConfig";
import React, { Context } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { initZod } from "./lib/zod";

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

<<<<<<< HEAD
// Handle stale chunk errors from lazy imports after deployments.
// Only reload once per session to prevent infinite loops on network failures.
window.addEventListener("vite:preloadError", (event) => {
  const reloaded = sessionStorage.getItem("vite-chunk-reload");
  if (!reloaded) {
    sessionStorage.setItem("vite-chunk-reload", "1");
    event.preventDefault();
    window.location.reload();
  }
});
=======
if (import.meta.env.PROD) {
  Sentry.init({
    environment: import.meta.env.MODE,
    dsn: "https://8801155bd0b848a09de9ebf6f387ebc8@sentry.io/5183632",
  });
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
>>>>>>> origin/develop

// Initialize i18n with namespaces from API before rendering the app
initI18n()
  .catch((error) => {
    console.error("Failed to initialize i18n:", error);
  })
  .finally(() => {
    initZod();
    initApp();
  });
