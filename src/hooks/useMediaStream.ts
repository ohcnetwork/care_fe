import { useCallback, useEffect, useRef, useState } from "react";

import { useMediaDevicePermission } from "@/Utils/useMediaDevicePermission";

interface useMediaStreamProps {
  constraints: MediaStreamConstraints;
  onError?: () => void;
}

type MediaStreamState = "accepted" | "denied" | "loading";

const getCameraDevices = async () => {
  return await navigator.mediaDevices.enumerateDevices();
};

export const useMediaStream = ({
  constraints,
  onError,
}: useMediaStreamProps) => {
  const streamRef = useRef<MediaStream | null>(null);
  const { requestPermission } = useMediaDevicePermission();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [cameraPermission, setcameraPermission] =
    useState<MediaStreamState>("loading");

  useEffect(() => {
    const handleDeviceChange = async () => {
      const updatedDevices = await getCameraDevices();
      setDevices(updatedDevices);
    };

    navigator.mediaDevices.ondevicechange = handleDeviceChange;

    return () => {
      navigator.mediaDevices.ondevicechange = null;
    };
  }, []);

  const startStream = useCallback(async () => {
    try {
      setcameraPermission("loading");
      const { hasPermission, mediaStream } =
        await requestPermission(constraints);

      if (!hasPermission || !mediaStream) {
        setcameraPermission("denied");
        onError?.();
        return;
      }

      setDevices(await getCameraDevices());
      setcameraPermission("accepted");
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
    cameraPermission,
  };
};
