import  { useEffect, useState } from "react";
import browserslist from "browserslist";
import { getUserAgentRegex } from "browserslist-useragent-regexp";
import packageJson from "../../../package.json";

const BrowserWarning = () => {
  const [isSupported, setIsSupported] = useState<boolean>(true);

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
    <div className="fixed left-0 top-0 z-50 w-full h-20 bg-gray-800 bg-opacity-60 flex items-center justify-center text-center text-gray-300">
    <div>
      <h2 className="text-lg font-medium">Unsupported Browser</h2>
      <p className="text-sm">
        You are using an unsupported browser. Please switch to a supported browser for the best experience.
      </p>
    </div>
  </div>
  );
};

export default BrowserWarning;
