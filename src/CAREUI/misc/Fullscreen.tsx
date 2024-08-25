import { useEffect, useRef } from "react";

interface Props {
  className?: string;
  fullscreenClassName?: string;
  children: React.ReactNode;
  fullscreen: boolean;
  onExit: (reason?: "DEVICE_UNSUPPORTED") => void;
}

export default function Fullscreen(props: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) {
      return;
    }

    if (props.fullscreen) {
      if (ref.current.requestFullscreen) {
        ref.current.requestFullscreen();
      } else {
        props.onExit("DEVICE_UNSUPPORTED");
      }
    } else {
      document.exitFullscreen?.();
    }
  }, [props.fullscreen]);

  useEffect(() => {
    const listener = () => {
      if (!document.fullscreenElement) {
        props.onExit();
      }
    };

    document.addEventListener("fullscreenchange", listener);

    return () => {
      document.removeEventListener("fullscreenchange", listener);
    };
  }, [props.onExit]);

  return (
    <div
      ref={ref}
      className={props.fullscreen ? props.fullscreenClassName : props.className}
    >
      {props.children}
    </div>
  );
}
