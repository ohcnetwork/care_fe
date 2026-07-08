import careConfig from "@careConfig";
import { useEffect } from "react";

interface Props {
  disabled?: boolean;
}

const UUID_PATTERN =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;

export function scrubUrl(url: string): string {
  return url.split("?")[0].replace(UUID_PATTERN, "<id>");
}

export default function Sentry({ disabled }: Props) {
  useEffect(() => {
    if (disabled || !careConfig.sentry.dsn) return;

    import("@sentry/browser").then((Sentry) => {
      Sentry.init({
        dsn: careConfig.sentry.dsn,
        environment: careConfig.sentry.environment,
        sendDefaultPii: false,
        beforeSend(event) {
          if (event.request?.url) {
            event.request.url = scrubUrl(event.request.url);
          }
          if (event.request) {
            delete event.request.headers;
            delete event.request.cookies;
          }
          event.breadcrumbs = event.breadcrumbs?.map((crumb) => {
            if (typeof crumb.data?.url === "string") {
              crumb.data.url = scrubUrl(crumb.data.url);
            }
            if (typeof crumb.data?.to === "string") {
              crumb.data.to = scrubUrl(crumb.data.to);
            }
            if (typeof crumb.data?.from === "string") {
              crumb.data.from = scrubUrl(crumb.data.from);
            }
            return crumb;
          });
          return event;
        },
      });
    });
  }, [disabled]);

  return null;
}
