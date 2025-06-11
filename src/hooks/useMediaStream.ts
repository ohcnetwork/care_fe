import { useCallback, useRef } from "react";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

interface useMediaStreamProps {
  constraints: {
    video?: boolean | { facingMode: string };
    audio?: boolean | MediaTrackConstraints;
  };
  onError?: () => void;
}

export const useMediaStream = ({
  constraints,
  onError,
}: useMediaStreamProps) => {
  const streamRef = useRef<MediaStream | null>(null);
  const { requestPermission } = useMediaDevicePermission();

  const startStream = useCallback(async () => {
    try {
      const { hasPermission, mediaStream } =
        await requestPermission(constraints);

      if (!hasPermission || !mediaStream) {
        onError?.();
        return;
      }

      streamRef.current = mediaStream;

      return mediaStream;
    } catch (err) {
      console.error("Error starting stream:", err);
    }
  }, [constraints, onError]);

  const stopStream = useCallback(() => {
    if (!streamRef.current) return;

    try {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    } catch (err) {
      console.error("Error stopping stream:", err);
    }
  }, []);

  return {
    startStream,
    stopStream,
    stream: streamRef.current,
  };
};
