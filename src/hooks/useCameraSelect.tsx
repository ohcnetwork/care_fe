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
  const [devices, setDevices] = useState<any[]>([]);
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

        let initialId = preferredDeviceId;
        if (initialId != null) {
          const exists = videoDevices.some(
            (device) => device.deviceId === initialId,
          );
          if (!exists && videoDevices.length > 0) {
            initialId = videoDevices[0].deviceId;
          }
        } else {
          initialId = videoDevices[0].deviceId;
        }
        setSelectedDeviceId(initialId);
        if (initialId && onChange) {
          onChange(initialId);
        }
      } catch {
        toast.error("Error fetching camera devices");
      }
    };

    getDevices();
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
          <SelectItem key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return { CameraSelect, selectedDeviceId };
};

export default useCameraSelect;
