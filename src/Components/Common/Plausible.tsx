import { useLocationChange } from "raviger";
import useConfig from "../../Common/hooks/useConfig";
import Script from "./Script";
import { useEffect } from "react";

export default function Plausible() {
  const { site_url, analytics_server_url } = useConfig();

  useEffect(() => triggerPageView(), []);
  useLocationChange(() => triggerPageView());

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

  const url = window.location.href;
  // Replace every all-numeric sequences between two slashes and uuids with "_ID_REDACTED_"
  const redactedUrl = url
    .replace(/\/\d+\//g, "/_ID_REDACTED_/")
    .replace(
      /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi,
      "_ID_REDACTED_"
    );

  // Send the pageview event to Plausible
  plausible("pageview", { u: redactedUrl });
};
