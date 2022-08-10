import { IOptions } from "./useMSEplayer";

export const useHLSPLayer = () => {
  const startStream = ({ onSuccess, onError }: IOptions = {}) => {
    try {
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
