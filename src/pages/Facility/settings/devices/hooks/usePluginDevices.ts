import { useCareApps } from "@/hooks/useCareApps";

import { PluginDeviceManifest } from "@/pluginTypes";

export const usePluginDevices = () => {
  const { apps } = useCareApps();

  return apps.reduce<PluginDeviceManifest[]>((acc, app) => {
    return [...acc, ...(app.devices || [])];
  }, []);
};

export const usePluginDevice = (type: string) => {
  const { apps, isLoading } = useCareApps();

  const devices = apps.reduce<PluginDeviceManifest[]>((acc, app) => {
    return [...acc, ...(app.devices || [])];
  }, []);

  const device = devices.find((device) => device.type === type);

  if (device) {
    return { isLoading: false, device } as const;
  }

  if (isLoading) {
    return { isLoading: true, device: null } as const;
  }

  throw new Error(`Device type ${type} not found`);
};
