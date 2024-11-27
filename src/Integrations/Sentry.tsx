import careConfig from "@careConfig";
import { useEffect } from "react";

interface Props {
  disabled?: boolean;
}

export default function Sentry({ disabled }: Props) {
  useEffect(() => {
    if (disabled || !careConfig.sentry.dsn || !careConfig.sentry.environment) {
      console.error(
        "Sentry is not configured correctly. Please check your environment variables.",
      );
      return;
    }

    import("@sentry/browser").then((Sentry) => {
      Sentry.init(careConfig.sentry);
    });
  }, [disabled]);

  return null;
}
