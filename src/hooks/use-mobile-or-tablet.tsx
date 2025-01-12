import * as React from "react";

const MOBILE_TABLET_BREAKPOINT = 1024;

export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<
    boolean | undefined
  >(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(
      `(max-width: ${MOBILE_TABLET_BREAKPOINT - 1}px)`,
    );

    const onChange = () => {
      setIsMobileOrTablet(window.innerWidth < MOBILE_TABLET_BREAKPOINT);
    };

    mql.addEventListener("change", onChange);
    setIsMobileOrTablet(window.innerWidth < MOBILE_TABLET_BREAKPOINT);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobileOrTablet;
}
