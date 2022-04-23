import { AssetData } from "../Components/Assets/AssetTypes";
export const getCameraConfig = (asset: AssetData) => {
  const { meta }: any = asset;
  return {
    middleware_hostname: meta.middleware_hostname,
    id: asset?.id,
    hostname: meta?.camera_address,
    username: meta?.camera_access_key?.split(":")[0],
    password: meta?.camera_access_key?.split(":")[1],
    accessKey: meta?.camera_access_key?.split(":")[2],
    port: 80,
  };
};
