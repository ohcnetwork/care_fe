import careConfig from "@careConfig";
import { useEffect } from "react";

interface Props {
  disabled?: boolean;
}

export default function Sentry({ disabled }: Props) {
  useEffect(() => {
    if (disabled) return;
    if (!careConfig.sentry.dsn || !careConfig.sentry.environment) {
      console.error(
        "Sentry is not configured correctly. Please check your environment variables.",
      );
      return;
    }

    import("@sentry/browser").then((Sentry) => {
      // Sentry v11 collects more data by default (e.g. user IP, cookies,
      // request bodies). Keep the v10 defaults: this is patient data.
      // https://github.com/getsentry/sentry-javascript/blob/develop/MIGRATION.md
      const deny = ["forwarded", "-ip", "remote-", "via", "-user"];
      Sentry.init({
        ...careConfig.sentry,
        attachStacktrace: false,
        dataCollection: {
          userInfo: false,
          cookies: false,
          httpHeaders: { request: { deny }, response: { deny } },
          httpBodies: [],
          urlQueryParams: { deny },
          genAI: { inputs: false, outputs: false },
          databaseQueryData: false,
          queues: false,
          graphQL: { document: false, variables: false },
        },
      });
    });
  }, [disabled]);

  return null;
}
