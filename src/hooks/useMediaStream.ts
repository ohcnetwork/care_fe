import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

interface useMediaStreamProps {
  constraints: MediaStreamConstraints;
  onError?: () => void;
}

const loadCameraDevices = async () => {
  return await navigator.mediaDevices.enumerateDevices();
};

export const useMediaStream = ({
  constraints,
  onError,
}: useMediaStreamProps) => {
  const streamRef = useRef<MediaStream | null>(null);
  const { requestPermission } = useMediaDevicePermission();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  useEffect(() => {
    navigator.mediaDevices.addEventListener("devicechange", loadCameraDevices);

    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        loadCameraDevices,
      );
    };
  }, [loadCameraDevices]);

  const startStream = useCallback(async () => {
    try {
      const { hasPermission, mediaStream } =
        await requestPermission(constraints);

      if (!hasPermission || !mediaStream) {
        onError?.();
        return;
      }

      setDevices(await loadCameraDevices());

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
    devices,
  };
};
