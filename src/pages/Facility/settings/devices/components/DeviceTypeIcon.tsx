import { CubeIcon } from "@radix-ui/react-icons";

import { usePluginDevices } from "@/pages/Facility/settings/devices/hooks/usePluginDevices";

const DeviceTypeIcon = ({
  type,
  ...props
}: {
  type: string | undefined;
  className?: string;
}) => {
  const deviceTypes = usePluginDevices();

  // Find the matching device type for the current device
  const deviceType = type
    ? deviceTypes.find((config) => config.type === type)
    : undefined;

  // Use the device type icon or fallback to CubeIcon
  const DeviceIcon = deviceType?.icon || CubeIcon;

  return <DeviceIcon {...props} />;
};

export default DeviceTypeIcon;
