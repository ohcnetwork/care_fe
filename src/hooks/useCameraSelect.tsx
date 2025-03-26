import { t } from "i18next";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  }, [onChange, preferredDeviceId]);

  const handleValueChange = (value: string) => {
    setSelectedDeviceId(value);
    setDeviceId(value);
    if (onChange) {
      onChange(value);
    }
  };

  const CameraSelect = () => (
    <Select value={selectedDeviceId} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a camera" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device: any) => (
          <SelectItem
            key={device.deviceId}
            value={device.deviceId || "Unknown Device"}
          >
            {device.label || `Camera ${device.deviceId}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return { CameraSelect, selectedDeviceId };
};

export default useCameraSelect;
