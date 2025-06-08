import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

interface useMediaStreamProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facingMode: string;
}
export const useMediaStream = ({
  open,
  facingMode,
  onOpenChange,
}: useMediaStreamProps) => {
  const [isStreaming, setIsStreaming] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { requestPermission } = useMediaDevicePermission();

  const startStream = useCallback(async () => {
    const hasPermission = await requestPermission(facingMode);
    if (!hasPermission.hasPermission) {
      onOpenChange(false);
      return;
    }
    try {
      const stream = hasPermission.mediaStream;
      streamRef.current = stream;
      setIsStreaming(true);
    } catch (err) {
      console.error("Error starting stream:", err);
      setIsStreaming(false);
    }
  }, [facingMode]);

  const stopStream = useCallback(() => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        streamRef.current = null;
        setIsStreaming(false);
      }
    } catch (err) {
      console.error("Error stopping stream:", err);
    }
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (open) {
      timer = setTimeout(() => {
        startStream();
      }, 100);
    }

    return () => {
      clearTimeout(timer);
      stopStream();
    };
  }, [open, startStream, stopStream]);

  return {
    isStreaming,
    startStream,
    stopStream,
  };
};
