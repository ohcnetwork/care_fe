import { useCareApps } from "@/hooks/useCareApps";

import { PluginDeviceManifest } from "@/pluginTypes";

export const usePluginDevices = () => {
  const careApps = useCareApps();

  return careApps.reduce<PluginDeviceManifest[]>((acc, app) => {
    return [...acc, ...(app.devices || [])];
  }, []);
};

export const usePluginDevice = (type: string) => {
  const devices = usePluginDevices();

  const device = devices.find((device) => device.type === type);

  if (!device) {
    throw new Error(`Device type ${type} not found`);
  }

  return device;
};
