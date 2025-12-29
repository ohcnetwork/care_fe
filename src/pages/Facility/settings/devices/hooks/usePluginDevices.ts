import { CareAppsContextType, useCareApps } from "@/hooks/useCareApps";

function getDevicesFromCareApps(careApps: CareAppsContextType) {
  return careApps.flatMap((app) => (!app.isLoading && app.devices) || []);
}

export const usePluginDevices = () => {
  const careApps = useCareApps();
  const devices = getDevicesFromCareApps(careApps);
  return devices;
};

export const usePluginDevice = (type: string) => {
  const careApps = useCareApps();
  const isLoading = careApps.some((app) => app.isLoading);
  const devices = getDevicesFromCareApps(careApps);
  const device = devices.find((device) => device.type === type);

  if (device) {
    return { isLoading: false, device } as const;
  }

  if (isLoading) {
    return { isLoading: true, device: null } as const;
  }

  throw new Error(`Device type ${type} not found`);
};
