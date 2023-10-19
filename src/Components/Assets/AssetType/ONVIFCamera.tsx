import { useEffect, useState } from "react";
import { AssetData } from "../AssetTypes";
import * as Notification from "../../../Utils/Notifications.js";
import { BedModel } from "../../Facility/models";
import axios from "axios";
import { getCameraConfig } from "../../../Utils/transformUtils";
import CameraConfigure from "../configure/CameraConfigure";
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
  const [facilityMiddlewareHostname, setFacilityMiddlewareHostname] =
    useState("");
  const [cameraAddress, setCameraAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [streamUuid, setStreamUuid] = useState("");
  const [bed, setBed] = useState<BedModel>({});
  const [newPreset, setNewPreset] = useState("");
  const [loadingAddPreset, setLoadingAddPreset] = useState(false);
  const [loadingSetConfiguration, setLoadingSetConfiguration] = useState(false);
  const [refreshPresetsHash, setRefreshPresetsHash] = useState(
    Number(new Date())
  );
  const { data: facility, loading } = useQuery(routes.getPermittedFacility, {
    pathParams: { id: facilityId },
  });
  const authUser = useAuthUser();
  useEffect(() => {
    if (facility?.middleware_address) {
      setFacilityMiddlewareHostname(facility.middleware_address);
    }
  }, [facility, facilityId]);

  useEffect(() => {
    if (asset) {
      setAssetType(asset?.asset_class);
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
          middleware_hostname: middlewareHostname, // TODO: remove this infavour of facility.middleware_address
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

  const addPreset = async (e: SyntheticEvent) => {
    e.preventDefault();
    const config = getCameraConfig(asset as AssetData);
    const data = {
      bed_id: bed.id,
      preset_name: newPreset,
    };
    try {
      setLoadingAddPreset(true);
      const presetData = await axios.get(
        `https://${facilityMiddlewareHostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
      );

      const { res } = await request(routes.createAssetBed, {
        body: {
          meta: { ...data, ...presetData.data },
          asset: assetId,
          bed: bed?.id as string,
        },
      });
      if (res?.status === 201) {
        Notification.Success({
          msg: "Preset Added Successfully",
        });
        setBed({});
        setNewPreset("");
        setRefreshPresetsHash(Number(new Date()));
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
    setLoadingAddPreset(false);
  };
  
  if (isLoading || loading || !facility) return <Loading />;

  const fallbackMiddleware =
    asset?.location_object?.middleware_address || facilityMiddlewareHostname;

  return (
    <div className="space-y-6">
      {["DistrictAdmin", "StateAdmin"].includes(authUser.user_type) && (
        <form className="rounded bg-white p-8 shadow" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-x-4 lg:grid-cols-2">
            <TextFormField
              name="middleware_hostname"
              label={
                <div className="flex flex-row gap-1">
                  <p>Middleware Hostname</p>
                  {!middlewareHostname && (
                    <div className="tooltip">
                      <CareIcon
                        icon="l-info-circle"
                        className="tooltip text-indigo-500 hover:text-indigo-600"
                      />
                      <span className="tooltip-text w-56 whitespace-normal">
                        Middleware hostname sourced from{" "}
                        {asset?.location_object?.middleware_address
                          ? "asset location"
                          : "asset facility"}
                      </span>
                    </div>
                  )}
                </div>
              }
              placeholder={fallbackMiddleware}
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
        <CameraConfigure
          asset={asset as AssetData}
          bed={bed}
          setBed={setBed}
          newPreset={newPreset}
          setNewPreset={setNewPreset}
          addPreset={addPreset}
          isLoading={loadingAddPreset}
          refreshPresetsHash={refreshPresetsHash}
          facilityMiddlewareHostname={facilityMiddlewareHostname}
        />
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
