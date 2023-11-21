import { MutableRefObject, useCallback, useState } from "react";
import ReactPlayer from "react-player";
import { isIOS } from "../../Utils/utils";
import { useHLSPLayer } from "../../Common/hooks/useHLSPlayer";
import { IOptions, useMSEMediaPlayer } from "../../Common/hooks/useMSEplayer";

export type StreamStatus = "playing" | "stop" | "loading" | "offline";

export default function usePlayer(
  streamUrl: string,
  ref: MutableRefObject<HTMLVideoElement | ReactPlayer | null>
) {
  const [playedOn, setPlayedOn] = useState<Date>();
  const [status, setStatus] = useState<StreamStatus>("stop");

  // Voluntarily disabling react-hooks/rules-of-hooks for this line as order of
  // hooks is maintained (since platform won't change in runtime)
  const _start = isIOS
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useHLSPLayer(ref.current as ReactPlayer).startStream
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useMSEMediaPlayer({
        // Voluntarily set to "" as it's used by `stopStream` only (which is not
        // used by this hook)
        config: { middlewareHostname: "" },
        url: streamUrl,
        videoEl: ref.current as HTMLVideoElement,
      }).startStream;

  const initializeStream = useCallback(
    ({ onSuccess, onError }: IOptions) => {
      setPlayedOn(undefined);
      setStatus("loading");
      _start({
        onSuccess,
        onError: (args) => {
          setStatus("offline");
          onError?.(args);
        },
      });
    },
    [ref.current, streamUrl]
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
