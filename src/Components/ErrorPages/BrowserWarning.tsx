import { useEffect, useState } from "react";
import supportedBrowsers from "../../Common/supportedBrowsers";

const BrowserWarning = () => {
  const [isSupported, setIsSupported] = useState<boolean>(true);
  const [browserInfo, setBrowserInfo] = useState<{ name: string; version: string }>({ name: "", version: "" });

  useEffect(() => {
    const userAgent = window.navigator.userAgent;

    if (!supportedBrowsers.test(userAgent)) {
      setIsSupported(false);

      // Use bowser to detect browser name and version
      const browser = bowser.getParser(userAgent).getBrowser();
      const name = browser.name || "Unknown";
      const version = browser.version || "Unknown";

      setBrowserInfo({ name, version });
    }
  }, []);

  if (isSupported) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 z-50 flex h-20 w-full items-center justify-center bg-gray-800 bg-opacity-60 text-center text-gray-300">
      <div>
        <h2 className="text-lg font-medium">Unsupported Browser</h2>
        <p className="text-sm">
          You are using an unsupported browser. Please switch to a supported
          browser for the best experience.
        </p>
      </div>
    </div>
  );
};

export default BrowserWarning;