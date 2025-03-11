import { usePath } from "raviger";
import { useEffect } from "react";

export function ScrollRestoration() {
  const pathname = usePath();

  useEffect(() => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);

      // scroll to top of the container if exists
      document.getElementById("pages")?.scrollTo(0, 0);
    });
  }, [pathname]);

  return null;
}
