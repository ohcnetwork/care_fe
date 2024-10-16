import { AssetData } from "../Components/Assets/AssetTypes";

export const getCameraConfig = (meta: AssetData["meta"]) => {
  return {
    middleware_hostname: meta?.middleware_hostname,
    hostname: meta?.local_ip_address,
    username: meta?.camera_access_key?.split(":")[0],
    password: meta?.camera_access_key?.split(":")[1],
    accessKey: meta?.camera_access_key?.split(":")[2],
    port: 80,
  };
};

export const makeAccessKey = (
  attrs: Pick<
    ReturnType<typeof getCameraConfig>,
    "username" | "password" | "accessKey"
  >,
) => {
  return [attrs.username, attrs.password, attrs.accessKey]
    .map((a) => a ?? "")
    .join(":");
};
