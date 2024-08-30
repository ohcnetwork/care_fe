import { MutableRefObject, useCallback, useState } from "react";
import { IOptions, useMSEMediaPlayer } from "./useMSEplayer";

export type StreamStatus = "playing" | "stop" | "loading" | "offline";

export default function usePlayer(
  ref: MutableRefObject<HTMLVideoElement | null>,
) {
  const [playedOn, setPlayedOn] = useState<Date>();
  const [status, setStatus] = useState<StreamStatus>("stop");

  const { startStream } = useMSEMediaPlayer({ videoEl: ref.current });

  const initializeStream = useCallback(
    ({ url, onSuccess, onError }: IOptions) => {
      setPlayedOn(undefined);
      setStatus("loading");
      startStream({
        url,
        onSuccess,
        onError: (args) => {
          setStatus("offline");
          onError?.(args);
        },
      });
    },
    [ref.current],
  );

  const onPlayCB = () => {
    // Voluntarily updating only if previously undefined (as this method may be invoked by the HTML video element on tab re-focus)
    setPlayedOn((prev) => (prev === undefined ? new Date() : prev));
    setStatus("playing");
  };

  return {
    status,
    setStatus,
    initializeStream,
    playedOn,
    onPlayCB,
  };
}
