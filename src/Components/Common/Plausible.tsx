import { useLocationChange } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import Script from "./Script";
import { useEffect } from "react";

export default function Plausible() {
  const { site_url, analytics_server_url } = useConfig();

  useLocationChange(() => triggerPageView());
  useEffect(() => triggerPageView(), []);

  return (
    <Script
      defer
      data-domain={site_url}
      src={`${analytics_server_url}/js/script.manual.js`}
    />
  );
}

const triggerPageView = () => {
  const plausible = (window as any).plausible;

  const url = new URL(window.location.href);

  // Remove all empty query parameters and replace all non-empty ones with
  // "[REDACTED]"
  url.searchParams.forEach((value, key) => {
    if (!value) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, "REDACTED");
    }
  });

  // Replace all `/<num>` and `/uuid` with "/_ID_REDACTED_"
  const redactedUrl = url
    .toString()
    .replace(
      /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi,
      "ID_REDACTED"
    )
    .replace(/\/\d+/g, "/ID_REDACTED");

  // Send the pageview event to Plausible
  plausible("pageview", { u: redactedUrl });
};
