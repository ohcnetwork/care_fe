import { t } from "i18next";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import usePreferredMediaDevice from "@/hooks/usePreferredMediaDevice";

interface UseCameraSelectOptions {
  onChange?: (deviceId: string) => void;
}

const useCameraSelect = ({ onChange }: UseCameraSelectOptions = {}) => {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const { preferredDeviceId, setDeviceId } = usePreferredMediaDevice();

  useEffect(() => {
    const getDevices = async () => {
      try {
        const mediaDevices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = mediaDevices.filter(
          ({ kind }) => kind === "videoinput",
        );
        setDevices(videoDevices);

        let deviceId = preferredDeviceId;
        if (deviceId != null) {
          const filteredId = videoDevices.some(
            (device) => device.deviceId === deviceId,
          );
          if (!filteredId && videoDevices.length > 0) {
            deviceId = videoDevices[0].deviceId;
          }
        } else {
          deviceId = videoDevices.length > 0 ? videoDevices[0].deviceId : "";
        }
        setSelectedDeviceId(deviceId);
        if (deviceId && onChange) {
          onChange(deviceId);
        }
      } catch {
        toast.error(t("error_fetching_camera_devices"));
      }
    };
    getDevices();
    const onDeviceChange = () => {
      getDevices();
    };
    navigator.mediaDevices.addEventListener("devicechange", onDeviceChange);
    return () => {
      navigator.mediaDevices.removeEventListener(
        "devicechange",
        onDeviceChange,
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devices, preferredDeviceId]);

  const handleValueChange = (value: string) => {
    setSelectedDeviceId(value);
    setDeviceId(value);
    if (onChange) {
      onChange(value);
    }
  };

  return { devices, selectedDeviceId, handleValueChange };
};

export default useCameraSelect;
