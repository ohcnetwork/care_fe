import { lazy, Suspense } from "react";

import supportedBrowsers from "@/supportedBrowsers";

// bowser and the dialog are only needed on unsupported browsers.
const UnsupportedBrowserNotice = lazy(
  () => import("@/components/ErrorPages/UnsupportedBrowserNotice"),
);

const isSupported = supportedBrowsers.test(window.navigator.userAgent);

const BrowserWarning = () => {
  if (isSupported) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <UnsupportedBrowserNotice />
    </Suspense>
  );
};

export default BrowserWarning;
