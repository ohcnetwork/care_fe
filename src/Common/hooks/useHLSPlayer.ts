import ReactPlayer from "react-player";
import { IOptions } from "./useMSEplayer";

export const useHLSPLayer = (ref: ReactPlayer | null) => {
  const startStream = ({ onSuccess, onError }: IOptions = {}) => {
    try {
      ref && ref.forceUpdate();
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
