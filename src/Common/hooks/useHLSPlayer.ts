import ReactPlayer from "react-player";

import { IOptions } from "@/Common/hooks/useMSEplayer";

export const useHLSPLayer = (ref: ReactPlayer | null) => {
  const startStream = ({ onSuccess, onError }: IOptions = {}) => {
    try {
      ref?.setState({ url: ref?.props.url + "&t=" + Date.now() });
      onSuccess && onSuccess(undefined);
    } catch (err) {
      onError && onError(err);
    }
  };
  return {
    startStream,
    stopStream: undefined,
  };
};
