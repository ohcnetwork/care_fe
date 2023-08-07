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
      src={`${analytics_server_url}/js/script.tagged-events.js`}
    />
  );
}

const BLACKLISTED_QUERY_PARAMS = ["page", "limit"];

const triggerPageView = () => {
  const plausible = (window as any).plausible;

  const url = new URL(window.location.href);

  // Remove all blacklisted and empty query parameters
  [...url.searchParams.entries()].map(([key, value]) => {
    if (value === "" || BLACKLISTED_QUERY_PARAMS.includes(key)) {
      url.searchParams.delete(key);
    }
  });

  const redactedUrl = url
    .toString()
    // Replace all uuids in the URL with "ID_REDACTED"
    .replace(
      /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi,
      "ID_REDACTED"
    )
    // Replace all numbers in the URL's path params with "ID_REDACTED"
    .replace(/\/\d+/g, "/ID_REDACTED");

  // Send the pageview event to Plausible
  plausible("pageview", { u: redactedUrl });
};

export const triggerGoal = (name: string, props: any) => {
  const plausible = (window as any).plausible;
  plausible(name, { props });
};
