import { useEffect, useState } from "react";

export default function useFullscreen(): [boolean, (value: boolean) => void] {
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

  const setFullscreen = (value: boolean) => {
    if (value) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  return [isFullscreen, setFullscreen];
}
