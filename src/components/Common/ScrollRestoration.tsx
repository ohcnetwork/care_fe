import { usePath } from "raviger";
import { useEffect } from "react";

export function ScrollRestoration() {
  const pathname = usePath();

  useEffect(() => {
    const scrollToTop = () => {
      window.scrollTo(0, 0);

      // Try scrolling the main container if it exists
      const mainContent = document.getElementById("pages");
      if (mainContent) {
        mainContent.scrollTo(0, 0);
      }
    };

    requestAnimationFrame(scrollToTop);

    // Optional: Fallback after load event if content loading is delayed
    const onLoad = () => scrollToTop();
    window.addEventListener("load", onLoad);

    return () => {
      window.removeEventListener("load", onLoad);
    };
  }, [pathname]);

  return null;
}
