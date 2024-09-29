import { useEffect, useState } from "react";
import { ResolvedMiddleware } from "../AssetTypes";
import * as Notification from "../../../Utils/Notifications.js";
import { getCameraConfig } from "../../../Utils/transformUtils";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import TextFormField from "../../Form/FormFields/TextFormField";
import { Submit } from "../../Common/components/ButtonV2";
import { SyntheticEvent } from "react";
import useAuthUser from "../../../Common/hooks/useAuthUser";

import request from "../../../Utils/request/request";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import useOperateCamera from "../../CameraFeed/useOperateCamera";
import CameraFeed from "../../CameraFeed/CameraFeed";

interface Props {
  assetId: string;
  facilityId: string;
  asset: any;
  onUpdated?: () => void;
}

const ONVIFCamera = ({ assetId, facilityId, asset, onUpdated }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [resolvedMiddleware, setResolvedMiddleware] =
    useState<ResolvedMiddleware>();
  const [cameraAddress, setCameraAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [streamUuid, setStreamUuid] = useState("");
  const [loadingSetConfiguration, setLoadingSetConfiguration] = useState(false);
  const { data: facility, loading } = useQuery(routes.getPermittedFacility, {
    pathParams: { id: facilityId },
  });
  const authUser = useAuthUser();

  useEffect(() => {
    if (asset) {
      setAssetType(asset?.asset_class);
      setResolvedMiddleware(asset?.resolved_middleware);
      const cameraConfig = getCameraConfig(asset);
      setMiddlewareHostname(cameraConfig.middleware_hostname);
      setCameraAddress(cameraConfig.hostname);
      setUsername(cameraConfig.username);
      setPassword(cameraConfig.password);
      setStreamUuid(cameraConfig.accessKey);
    }
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(cameraAddress)) {
      setLoadingSetConfiguration(true);
      setIpAddress_error("");
      const data = {
        meta: {
          asset_type: "CAMERA",
          middleware_hostname: middlewareHostname,
          local_ip_address: cameraAddress,
          camera_access_key: `${username}:${password}:${streamUuid}`,
        },
      };
      const { res } = await request(routes.partialUpdateAsset, {
        pathParams: { external_id: assetId },
        body: data,
      });
      if (res?.status === 200) {
        Notification.Success({ msg: "Asset Configured Successfully" });
        onUpdated?.();
      } else {
        Notification.Error({ msg: "Something went wrong!" });
      }
      setLoadingSetConfiguration(false);
    } else {
      setIpAddress_error("IP address is invalid");
    }
  };

  const { operate, key } = useOperateCamera(asset.id);

  if (isLoading || loading || !facility) return <Loading />;

  return (
    <div className="flex w-full flex-col gap-4 p-4 pr-0 md:flex-row md:items-start">
      {["DistrictAdmin", "StateAdmin"].includes(authUser.user_type) && (
        <form
          className="w-full max-w-xs rounded-lg bg-white p-4 shadow"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col">
            <TextFormField
              name="middleware_hostname"
              label={
                <div className="flex flex-row gap-1">
                  <p>Middleware Hostname</p>
                  {resolvedMiddleware?.source != "asset" && (
                    <div className="tooltip">
                      <CareIcon
                        icon="l-info-circle"
                        className="tooltip text-indigo-500 hover:text-indigo-600"
                      />
                      <span className="tooltip-text w-56 whitespace-normal">
                        Middleware hostname sourced from asset{" "}
                        {resolvedMiddleware?.source}
                      </span>
                    </div>
                  )}
                </div>
              }
              placeholder={resolvedMiddleware?.hostname}
              value={middlewareHostname}
              onChange={({ value }) => setMiddlewareHostname(value)}
            />
            <TextFormField
              name="camera_address"
              label="Local IP Address"
              autoComplete="off"
              value={cameraAddress}
              onChange={({ value }) => setCameraAddress(value)}
              error={ipadrdress_error}
            />
            <TextFormField
              name="username"
              label="Username"
              autoComplete="off"
              value={username}
              onChange={({ value }) => setUsername(value)}
            />
            <TextFormField
              name="password"
              label="Password"
              autoComplete="off"
              type="password"
              value={password}
              onChange={({ value }) => setPassword(value)}
            />
            <TextFormField
              name="stream_uuid"
              label="Stream UUID"
              autoComplete="off"
              value={streamUuid}
              type="password"
              className="tracking-widest"
              labelClassName="tracking-normal"
              onChange={({ value }) => setStreamUuid(value)}
            />
          </div>
          <div className="flex justify-end">
            <Submit
              disabled={loadingSetConfiguration}
              className="w-full md:w-auto"
              label="Set Configuration"
            />
          </div>
        </form>
      )}

      {assetType === "ONVIF" ? (
        <div className="w-full overflow-hidden rounded-lg bg-white shadow">
          <CameraFeed asset={asset} key={key} operate={operate} />
        </div>
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
