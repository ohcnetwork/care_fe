import React, { useEffect, useState } from "react";
import browserslist from "browserslist";
import { getUserAgentRegex} from "browserslist-useragent-regexp";
import packageJson from "../package.json"; 
// "browserslist": {
//     "production": [
//       ">0.2%",
//       "not dead",
//       "not op_mini all"
//     ]
const BrowserWarning = () => {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const supportedBrowsers = browserslist(packageJson.browserslist.production);
    console.log("Supported Browsers List:", supportedBrowsers);

    const regex =getUserAgentRegex({browsers: supportedBrowsers});
    console.log("Generated Regex:", regex);
    console.log("Matches Generated Regex:", regex.test(userAgent));

    if (!regex.test(userAgent)) {
      setIsSupported(false);
    }
  }, []);

  if (isSupported) {
    return null;
  }

  return (
    <div style={warningStyle}>
      <h2>Unsupported Browser</h2>
      <p>
        You are using an unsupported browser. Please switch to a supported
        browser for the best experience.
      </p>
    </div>
  );
};

const warningStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  backgroundColor: "red",
  color: "white",
  textAlign: "center",
  padding: "10px",
  zIndex: 1000,
};


export default BrowserWarning;