import "@/style/index.css";

import App from "@/App";
import { AuthContextType, AuthUserContext } from "@/hooks/useAuthUser";
import { initI18n } from "@/i18n";
import { PlugConfigMeta } from "@/types/plugConfig";
import careConfig, { env } from "@careConfig";
import React, { Context } from "react";
import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import { z } from "zod";
import { initZod } from "./lib/zod";

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
    __showLoadingError?: (message: string) => void;
  }
}

// runtime-env.js always sets this, so undefined means it didn't load. Starting
// with the build's values could send requests to another deployment's backend,
// so stop here; public/loading-screen.js shows a retry screen.
if (window.__CARE_RUNTIME_ENV__ === undefined) {
  throw new Error("Couldn't load /runtime-env.js");
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

// The build checks its own values with scripts/validate-env.ts, but not the
// overrides from runtime-env.js. Check them, merged with the build's values,
// before the first API request, and stop with an error if any is invalid.
async function validateRuntimeEnv() {
  if (Object.keys(window.__CARE_RUNTIME_ENV__ ?? {}).length === 0) {
    return;
  }

  // The schema is a separate chunk. If it can't load, stop with a retry rather
  // than leave the loading screen up.
  const { envSchema } = await import("../scripts/validate-env").catch(
    (error: unknown) => {
      window.__showLoadingError?.(
        "Couldn't check this site's settings. Check your connection and try again.",
      );
      throw error;
    },
  );
  const result = await envSchema.safeParseAsync(env);
  if (result.success) {
    return;
  }

  const names = new Set(result.error.issues.map((issue) => issue.path[0]));
  // i18n isn't initialized yet, and its setup depends on these settings.
  window.__showLoadingError?.(
    `This site's settings aren't valid: ${[...names].join(", ")}. Ask the site's administrator to fix them.`,
  );
  throw new Error(
    `Invalid settings in /runtime-env.js\n${z.prettifyError(result.error)}`,
  );
}

validateRuntimeEnv().then(() =>
  // Initialize i18n with namespaces from API before rendering the app
  initI18n()
    .catch((error) => {
      console.error("Failed to initialize i18n:", error);
    })
    .finally(() => {
      initZod();
      initApp();
    }),
);
