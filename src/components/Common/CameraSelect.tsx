import React from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import useCameraSelect from "@/hooks/useCameraSelect";

interface CameraSelectProps {
  onChange?: (deviceId: string) => void;
}

const CameraSelect: React.FC<CameraSelectProps> = ({ onChange }) => {
  const { devices, selectedDeviceId, handleValueChange } = useCameraSelect({
    onChange,
  });

  return (
    <Select value={selectedDeviceId} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a camera" />
      </SelectTrigger>
      <SelectContent>
        {devices.map((device) => (
          <SelectItem key={device.deviceId} value={device.deviceId}>
            {device.label || `Camera ${device.deviceId}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default CameraSelect;
