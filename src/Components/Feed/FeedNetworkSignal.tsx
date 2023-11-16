import { useEffect, useState } from "react";
import { calculateVideoDelay } from "./utils";
import NetworkSignal from "../../CAREUI/display/NetworkSignal";
import { StreamStatus } from "./usePlayer";

interface Props {
  playerRef: React.RefObject<HTMLVideoElement>;
  playedOn: Date | undefined;
  status: StreamStatus;
}

export default function FeedNetworkSignal(props: Props) {
  const [videoDelay, setVideoDelay] = useState<number>();
  useEffect(() => {
    const interval = setInterval(() => {
      setVideoDelay(calculateVideoDelay(props.playerRef, props.playedOn));
    }, 500);

    return () => {
      clearInterval(interval);
    };
  }, [props.playedOn]);

  return (
    <NetworkSignal strength={getStrength(props.status, videoDelay)}>
      <span className="w-14 text-xs font-bold tracking-wide">
        {!!videoDelay && `${(videoDelay * 1e3) | 1} ms`}
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
  if (ms < 5000) return 2;
  return 1;
};
