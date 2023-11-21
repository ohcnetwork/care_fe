import { useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  fullscreen: boolean;
  onExit: () => void;
}

export default function Fullscreen({ children, fullscreen, onExit }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (fullscreen) {
      ref.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  }, [fullscreen]);

  useEffect(() => {
    const listener = () => {
      if (!document.fullscreenElement) {
        onExit();
      }
    };

    document.addEventListener("fullscreenchange", listener);
    return () => {
      document.removeEventListener("fullscreenchange", listener);
    };
  }, [onExit]);

  return <div ref={ref}>{children}</div>;
}
