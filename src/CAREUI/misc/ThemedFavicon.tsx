import { useEffect } from "react";

export default function ThemedFavicon() {
  useEffect(() => {
    const darkThemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    const favicon = document.querySelector(
      "link[rel~='icon']",
    ) as HTMLLinkElement;

    favicon.href = darkThemeMq.matches ? "/favicon.ico" : "/favicon-light.ico";
  }, []);

  return null;
}
