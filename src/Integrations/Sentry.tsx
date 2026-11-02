import careConfig from "@careConfig";
import { useEffect } from "react";

interface Props {
  disabled?: boolean;
}

/**
 * Initialises Sentry once the browser is idle, so the SDK stays off the
 * critical path of the first render. Errors thrown before it loads are not
 * reported.
 */
export default function Sentry({ disabled }: Props) {
  useEffect(() => {
    if (disabled) return;
    if (!careConfig.sentry.dsn || !careConfig.sentry.environment) {
      console.error(
        "Sentry is not configured correctly. Please check your environment variables.",
      );
      return;
    }

    const init = () => {
      import("@sentry/browser").then((Sentry) => {
        Sentry.init(careConfig.sentry);
      });
    };

    if ("requestIdleCallback" in window) {
      const handle = window.requestIdleCallback(init, { timeout: 5000 });
      return () => window.cancelIdleCallback(handle);
    }

    const handle = setTimeout(init, 2000);
    return () => clearTimeout(handle);
  }, [disabled]);

  return null;
}
