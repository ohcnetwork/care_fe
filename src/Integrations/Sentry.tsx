import { useEffect } from "react";
import useConfig from "../Common/hooks/useConfig";

interface Props {
  disabled?: boolean;
}

export default function Sentry({ disabled }: Props) {
  const { sentry_dsn, sentry_environment } = useConfig();

  useEffect(() => {
    if (disabled || !sentry_dsn) {
      return;
    }

    import("@sentry/browser").then((Sentry) => {
      Sentry.init({
        environment: sentry_environment,
        dsn: sentry_dsn,
      });
    });
  }, [sentry_dsn, sentry_environment, disabled]);

  return null;
}
