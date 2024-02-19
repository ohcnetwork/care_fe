import { useEffect, useState } from "react";
import { AssetData, ResolvedMiddleware } from "../AssetTypes";
import { useDispatch } from "react-redux";
import {
  partialUpdateAssetBed,
  listAssetBeds,
  deleteAssetBed,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { BedModel } from "../../Facility/models";
import axios from "axios";
import { getCameraConfig } from "../../../Utils/transformUtils";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import TextFormField from "../../Form/FormFields/TextFormField";
import { Submit } from "../../Common/components/ButtonV2";
import { SyntheticEvent } from "react";
import LiveFeed from "../../Facility/Consultations/LiveFeed";
import Card from "../../../CAREUI/display/Card";
import { BoundaryRange } from "../../../Common/constants";
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
  const [resolvedMiddleware, setResolvedMiddleware] =
    useState<ResolvedMiddleware>();
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
  const [boundaryPreset, setBoundaryPreset] = useState<any>(null);
  const [toUpdateBoundary, setToUpdateBoundary] = useState<boolean>(false);
  const [loadingAddBoundaryPreset, setLoadingAddBoundaryPreset] =
    useState<boolean>(false);
  const [updateBoundaryNotif, setUpdateBoundaryNotif] =
    useState<string>("notUpdated");
  const [presets, setPresets] = useState<any[]>([]);
  const dispatch = useDispatch<any>();

  const mapZoomToBuffer = (zoom: number): number => {
    interface bufferAtZoom {
      [key: string]: number;
    }
    const bufferAtMaxZoom: bufferAtZoom = {
      "0.3": 0.2,
      "0.4": 0.1,
      "0.5": 0.05,
    };
    let buffer = 0;
    Object.keys(bufferAtMaxZoom).forEach((key: string) => {
      if (zoom <= Number(key)) {
        buffer = bufferAtMaxZoom[key];
      }
    });
    return buffer !== 0 ? buffer : 0.0625;
  };

  const calcBoundary = (presets: any[]): BoundaryRange => {
    const INT_MAX = 0.9;
    const boundary: BoundaryRange = {
      max_x: -INT_MAX,
      min_x: INT_MAX,
      max_y: -INT_MAX,
      min_y: INT_MAX,
    };

    const edgePresetsZoom: BoundaryRange = {
      max_x: 0,
      min_x: 0,
      max_y: 0,
      min_y: 0,
    };

    presets.forEach((preset: any) => {
      if (preset?.meta?.position) {
        const position = preset.meta.position;
        if (position.x > boundary.max_x) {
          boundary.max_x = position.x;
          edgePresetsZoom.max_x = position.zoom;
        }
        if (position.x < boundary.min_x) {
          boundary.min_x = position.x;
          edgePresetsZoom.min_x = position.zoom;
        }
        if (position.y > boundary.max_y) {
          boundary.max_y = position.y;
          edgePresetsZoom.max_y = position.zoom;
        }
        if (position.y < boundary.min_y) {
          boundary.min_y = position.y;
          edgePresetsZoom.min_y = position.zoom;
        }
      }
    });

    Object.keys(edgePresetsZoom).forEach((key) => {
      const zoom = edgePresetsZoom[key as keyof BoundaryRange];
      const buffer = mapZoomToBuffer(zoom);

      if (key == "max_x" || key == "max_y") {
        boundary[key] = boundary[key] + buffer;
      } else {
        boundary[key as keyof BoundaryRange] =
          boundary[key as keyof BoundaryRange] - buffer;
      }
    });
    if (boundary.max_x <= boundary.min_x || boundary.max_y <= boundary.min_y) {
      return {
        max_x: INT_MAX,
        min_x: -INT_MAX,
        max_y: INT_MAX,
        min_y: -INT_MAX,
      };
    }
    return boundary;
  };
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

  const fetchBoundaryBedPreset = async () => {
    const res = await dispatch(listAssetBeds({ bed: bed.id }));
    if (res && res.status === 200 && res.data) {
      let bedAssets: any[] = res.data.results;

      if (bedAssets.length > 0) {
        let boundaryPreset = null;
        bedAssets = bedAssets.filter((bedAsset: any) => {
          if (bedAsset?.asset_object?.meta?.asset_type != "CAMERA") {
            return false;
          } else if (bedAsset?.meta?.type == "boundary") {
            boundaryPreset = bedAsset;
            return false;
          } else if (bedAsset?.meta?.position) {
            return true;
          }
          return false;
        });
        if (boundaryPreset) {
          setBoundaryPreset(boundaryPreset);
        } else {
          setBoundaryPreset(null);
        }
        setPresets(bedAssets);
      }
    } else {
      setPresets([]);
      setBoundaryPreset(null);
    }
  };

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

  const addBoundaryPreset = async () => {
    const config = getCameraConfig(asset as AssetData);
    try {
      setLoadingAddBoundaryPreset(true);

      if (bed?.id) {
        const presetData = await axios.get(
          `https://${resolvedMiddleware?.hostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
        );
        const range = calcBoundary(presets);
        const meta = {
          type: "boundary",
          preset_name: `${bed?.name} boundary`,
          bed_id: bed?.id,
          error: presetData.data.error,
          utcTime: presetData.data.utcTime,
          range: range,
        };
        const res = await Promise.resolve(
          dispatch(createAssetBed({ meta: meta }, assetId, bed?.id as string))
        );
        if (res?.status === 201) {
          Notification.Success({
            msg: "Boundary Preset Added Successfully",
          });
          // setBed({});
          setRefreshPresetsHash(Number(new Date()));
        } else {
          Notification.Error({
            msg: "Failed to add Boundary Preset",
          });
        }
      } else {
        Notification.Error({
          msg: "Please select a bed to add Boundary Preset",
        });
      }
    } catch (e) {
      console.log(e);
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
    setLoadingAddBoundaryPreset(false);
  };

  const updateBoundaryPreset = async () => {
    if (boundaryPreset && bed?.id) {
      try {
        if (
          !boundaryPreset?.asset_object?.id ||
          !boundaryPreset?.bed_object?.id
        ) {
          Notification.Error({
            msg: "Something went wrong..!",
          });
          return;
        }
        const data = {
          asset: boundaryPreset.asset_object.id,
          bed: boundaryPreset.bed_object.id,
          meta: boundaryPreset.meta,
        };
        const res = await Promise.resolve(
          dispatch(partialUpdateAssetBed(data, boundaryPreset.id as string))
        );
        if (res?.status === 200) {
          setUpdateBoundaryNotif("updated");
        } else {
          setUpdateBoundaryNotif("error");
          Notification.Error({
            msg: "Failed to modify Boundary Preset",
          });
        }
      } catch (e) {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    }
  };
  const deleteBoundaryPreset = async () => {
    if (boundaryPreset) {
      try {
        const res = await Promise.resolve(
          dispatch(deleteAssetBed(boundaryPreset.id))
        );
        if (res?.status === 204) {
          Notification.Success({
            msg: "Boundary Preset Deleted Successfully",
          });
          // setBed({});
          setRefreshPresetsHash(Number(new Date()));
        } else {
          Notification.Error({
            msg: "Failed to delete Boundary Preset",
          });
        }
      } catch (e) {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    }
  };

  const addPreset = async () => {
    const config = getCameraConfig(asset as AssetData);
    const data = {
      bed_id: bed.id,
      preset_name: newPreset,
    };
    try {
      setLoadingAddPreset(true);
      const presetData = await axios.get(
        `https://${resolvedMiddleware?.hostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
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
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
      setNewPreset("");
      setRefreshPresetsHash(Number(new Date()));
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
    setLoadingAddPreset(false);
  };
  if (isLoading || loading || !facility) return <Loading />;

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
        <>
          <Card className="mt-4" title="Live Feed">
            <LiveFeed
              middlewareHostname={resolvedMiddleware}
              asset={getCameraConfig(asset)}
              addPreset={addPreset}
              setBed={setBed}
              bed={bed}
              newPreset={newPreset}
              loadingAddPreset={loadingAddPreset}
              setNewPreset={setNewPreset}
              showRefreshButton={true}
              refreshPresetsHash={refreshPresetsHash}
              boundaryPreset={boundaryPreset}
              fetchBoundaryBedPreset={fetchBoundaryBedPreset}
              setBoundaryPreset={setBoundaryPreset}
              addBoundaryPreset={addBoundaryPreset}
              updateBoundaryPreset={updateBoundaryPreset}
              deleteBoundaryPreset={deleteBoundaryPreset}
              toUpdateBoundary={toUpdateBoundary}
              setToUpdateBoundary={setToUpdateBoundary}
              loadingAddBoundaryPreset={loadingAddBoundaryPreset}
              updateBoundaryNotif={updateBoundaryNotif}
              setUpdateBoundaryNotif={setUpdateBoundaryNotif}
            />
          </Card>
        </>
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
