import { useEffect, useState } from "react";

interface HTMLElementWithFullscreen extends HTMLElement {
  webkitEnterFullscreen?: () => void;
  webkitExitFullscreen?: () => void;
}

export default function useFullscreen() {
  const [isFullscreen, _setIsFullscreen] = useState(
    !!document.fullscreenElement,
  );

  useEffect(() => {
    const onFullscreenChange = () =>
      _setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  function openFullscreen(elem: HTMLElementWithFullscreen) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (elem.webkitEnterFullscreen)
      elem.webkitEnterFullscreen(); // Safari
    else elem.requestFullscreen();
  }

  function exitFullscreen(elem: HTMLElementWithFullscreen) {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    if (elem.webkitExitFullscreen)
      elem.webkitExitFullscreen(); // Safari
    else document.exitFullscreen();
  }

  const setFullscreen = (
    value: boolean,
    element?: HTMLElement,
    enterLandscape?: boolean,
  ) => {
    const fullscreenElement = element ?? document.documentElement;

    if (value) {
      openFullscreen(fullscreenElement);
      if (enterLandscape) {
        (screen.orientation as any)?.lock?.("landscape");
      }
    } else {
      exitFullscreen(fullscreenElement);
    }
  };

  return [isFullscreen, setFullscreen] as const;
}
