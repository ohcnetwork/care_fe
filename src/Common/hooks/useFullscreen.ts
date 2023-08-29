import { useEffect, useState } from "react";

export default function useFullscreen(): [
  boolean,
  (value: boolean, element?: HTMLElement) => void
] {
  const [isFullscreen, _setIsFullscreen] = useState(
    !!document.fullscreenElement
  );

  useEffect(() => {
    const onFullscreenChange = () =>
      _setIsFullscreen(!!document.fullscreenElement);

    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const setFullscreen = (value: boolean, element?: HTMLElement) => {
    const fullscreenElement = element ?? document.documentElement;

    if (value) fullscreenElement.requestFullscreen();
    else document.exitFullscreen();
  };

  return [isFullscreen, setFullscreen];
}
