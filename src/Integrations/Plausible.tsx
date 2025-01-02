import careConfig from "@careConfig";
import { useLocationChange } from "raviger";
import { useEffect } from "react";

import Script from "@/components/Common/Script";

export default function Plausible() {
  useLocationChange(() => {
    plausible("pageview");
  });

  useEffect(() => {
    const missingConfig = [];
    if (!careConfig.plausible.domain) missingConfig.push("domain");
    if (!careConfig.plausible.server) missingConfig.push("server");
    if (missingConfig.length > 0) {
      console.error(
        `Plausible analytics disabled. Missing configuration: ${missingConfig.join(", ")}`,
      );
      return;
    }

    plausible("pageview");
  }, []);

  return (
    <Script
      defer
      data-domain={careConfig.plausible.domain}
      // To add another extension, combine the extension using dots. Refer: https://plausible.io/docs/script-extensions#you-can-combine-extensions-according-to-your-needs
      // Do not accidentally remove existing extensions.
      // `manual` extension is used for the URL to be overridden. See https://plausible.io/docs/script-extensions#scriptmanualjs
      src={`${careConfig.plausible.server}/js/script.manual.tagged-events.js`}
    />
  );
}

const BLACKLISTED_QUERY_PARAMS = ["page", "limit"];

const getRedactedUrl = () => {
  const url = new URL(window.location.href);

  // Remove all blacklisted and empty query parameters
  [...url.searchParams.entries()].map(([key, value]) => {
    if (value === "" || BLACKLISTED_QUERY_PARAMS.includes(key)) {
      url.searchParams.delete(key);
    }
  });

  return (
    url
      .toString()
      // Replace all uuids in the URL with "ID_REDACTED"
      .replace(
        /[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}/gi,
        "ID_REDACTED",
      )
      // Replace all numbers in the URL's path params with "ID_REDACTED"
      .replace(/\/\d+/g, "/ID_REDACTED")
  );
};

/**
 * Send a custom event to Plausible
 * @param event Name of the event
 * @param data Additional data to send with the event
 */
const plausible = (event: string, data: object = {}) => {
  const plausible = (window as any).plausible;

  if (plausible) {
    plausible(event, { ...data, u: getRedactedUrl() });
  }
};

/**
 * Trigger a custom event
 * @param name Name of the event
 * @param props Additional properties to send with the event
 * @example
 * triggerGoal("Add New Location");
 * triggerGoal("Add New Location", { locationId: "123" });
 *
 */
export const triggerGoal = (name: string, props: object) => {
  plausible(name, { props });
};
