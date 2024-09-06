import careConfig from "@careConfig";
import { useEffect } from "react";

interface Props {
  disabled?: boolean;
}

export default function Sentry({ disabled }: Props) {
  useEffect(() => {
    if (disabled || !careConfig.sentry.dsn) {
      return;
    }

    import("@sentry/browser").then((Sentry) => {
      Sentry.init(careConfig.sentry);
    });
  }, [disabled]);

  return null;
}
