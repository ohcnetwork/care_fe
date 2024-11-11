import { useEffect, useState } from "react";

import NetworkSignal from "@/CAREUI/display/NetworkSignal";

import { StreamStatus } from "@/components/CameraFeed/FeedAlert";
import { calculateVideoDelay } from "@/components/CameraFeed/utils";

interface Props {
  playerRef: React.RefObject<HTMLVideoElement>;
  playedOn: Date | undefined;
  status: StreamStatus;
  onReset: () => void;
}

export default function FeedNetworkSignal(props: Props) {
  const [videoDelay, setVideoDelay] = useState<number>();
  useEffect(() => {
    const interval = setInterval(() => {
      const delay = calculateVideoDelay(props.playerRef, props.playedOn);
      setVideoDelay(delay);

      // Voluntarily resetting for negative delays too as:
      // 1. We should not allow users to see what happens in the future!
      //    They'll figure out that we have a time machine in our hands.
      // 2. This value may become negative when the web-socket stream
      //    disconnects while the tab was not in focus.
      if (-5 > delay || delay > 5) {
        if (document.hasFocus() && props.status !== "loading") {
          props.onReset();
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [props.playedOn, props.onReset, setVideoDelay]);

  return (
    <NetworkSignal strength={getStrength(props.status, videoDelay)}>
      <span className="text-xs font-bold leading-none tracking-wide md:w-14">
        {videoDelay ? (
          `${(videoDelay * 1e3) | 1} ms`
        ) : (
          <span className="font-normal text-white/50">No signal</span>
        )}
      </span>
    </NetworkSignal>
  );
}

const getStrength = (status: StreamStatus, videoDelay?: number) => {
  if (status !== "playing" || videoDelay === undefined) {
    return 0;
  }

  const ms = videoDelay * 1e3;

  if (ms < 500) return 3;
  if (ms < 2000) return 2;
  return 1;
};
