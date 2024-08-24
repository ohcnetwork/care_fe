import React, { useEffect, useState } from "react";
import browserslist from "browserslist";
import { getUserAgentRegex } from "browserslist-useragent-regexp";
import packageJson from "../../../package.json";

const BrowserWarning = () => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const supportedBrowsers = browserslist(packageJson.browserslist.production);
    console.log("Supported Browsers List:", supportedBrowsers);

    const regex = getUserAgentRegex({
      browsers: supportedBrowsers,
      allowHigherVersions: true,
      ignorePatch: true,
      ignoreMinor: true,
    });

    if (!regex.test(userAgent)) {
      setIsSupported(false);
    }
  }, []);

  if (isSupported) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 z-50 w-full bg-red-500 p-2 text-center text-white">
      <h2>Unsupported Browser</h2>
      <p>
        You are using an unsupported browser. Please switch to a supported
        browser for the best experience.
      </p>
    </div>
  );
};


export default BrowserWarning;
