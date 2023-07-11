import { useEffect, useState } from "react";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import {
  partialUpdateAsset,
  partialUpdateAssetBed,
  createAssetBed,
  getPermittedFacility,
  listAssetBeds,
  deleteAssetBed,
} from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { BedModel } from "../../Facility/models";
import axios from "axios";
import { getCameraConfig } from "../../../Utils/transformUtils";
import CameraConfigure from "../configure/CameraConfigure";
import CameraBoundaryConfigure from "../configure/CameraBoundayConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import TextFormField from "../../Form/FormFields/TextFormField";
import { Submit } from "../../Common/components/ButtonV2";
import { SyntheticEvent } from "react";

interface ONVIFCameraProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

type direction = "left" | "right" | "up" | "down";

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const { assetId, facilityId, asset } = props;
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
  const [direction, setDirection] = useState<direction>("left");
  const [refreshPresetsHash, setRefreshPresetsHash] = useState(
    Number(new Date())
  );
  const [boundayPresetExists, setBoundaryPresetExists] =
    useState<boolean>(false);
  const [boundaryPreset, setBoundaryPreset] = useState<any>(null);
  const dispatch = useDispatch<any>();
  const boundaryBuffer = 2;
  useEffect(() => {
    const fetchFacility = async () => {
      const res = await dispatch(getPermittedFacility(facilityId));

      if (res.status === 200 && res.data) {
        setFacilityMiddlewareHostname(res.data.middleware_address);
      }
    };

    if (facilityId) fetchFacility();
  }, [dispatch, facilityId]);

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

  // checking if boundary preset exists
  // no need to delete
  useEffect(() => {
    const getBoundaryBedPreset = async () => {
      const res = await dispatch(listAssetBeds({ bed: bed.id }));
      if (res && res.status === 200 && res.data) {
        const bedAssets = res.data.results;

        if (bedAssets.length > 0) {
          const boundaryPreset = bedAssets.find(
            (bedAsset: any) => bedAsset.meta.type === "boundary"
          );
          if (boundaryPreset) {
            setBoundaryPresetExists(true);
            setBoundaryPreset(boundaryPreset);
          } else {
            setBoundaryPresetExists(false);
          }
        }
      }
    };
    if (bed?.id) getBoundaryBedPreset();
  }, [bed]);

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
      const res: any = await Promise.resolve(
        dispatch(partialUpdateAsset(assetId, data))
      );
      if (res?.status === 200) {
        Notification.Success({
          msg: "Asset Configured Successfully",
        });
        window.location.reload();
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
      setLoadingSetConfiguration(false);
    } else {
      setIpAddress_error("Please Enter a Valid Camera address !!");
    }
  };

  // adding boundary preset
  // no need to delete

  const addBoundaryPreset = async (e: SyntheticEvent) => {
    e.preventDefault();
    // const config = getCameraConfig(asset as AssetData);
    try {
      setLoadingAddPreset(true);

      //delete this
      const presetData = {
        data: {
          error: "no error",
          utcTime: "2021-09-09T09:09:09.000Z",
        },
      };
      // const presetData = await axios.get(
      //   `https://${facilityMiddlewareHostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
      // );
      const meta = {
        type: "boundary",
        preset_name: `${bed.name}-boundary`,
        bed_id: bed.id,
        error: presetData.data.error,
        utcTime: presetData.data.utcTime,
        range: {
          max_x: boundaryBuffer,
          min_x: -boundaryBuffer,
          max_y: boundaryBuffer,
          min_y: -boundaryBuffer,
        },
      };
      const res = await Promise.resolve(
        dispatch(createAssetBed({ meta: meta }, assetId, bed?.id as string))
      );
      if (res?.status === 201) {
        Notification.Success({
          msg: "Boundary Preset Added Successfully",
        });
        setBed({});
        setNewPreset("");
        setRefreshPresetsHash(Number(new Date()));
        setBoundaryPresetExists(true);
      } else {
        Notification.Error({
          msg: "Failed to add Boundary Preset",
        });
      }
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
    setLoadingAddPreset(false);
  };

  const modifyBoundaryPreset = async () => {
    const config = getCameraConfig(asset as AssetData);
    if (boundaryPreset) {
      try {
        const presetData = await axios.get(
          `https://${facilityMiddlewareHostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
        );
        const cameraPosition = presetData.data.position;
        const boundaryRange = boundaryPreset.meta.range;
        let range;
        if (direction == "left") {
          if (cameraPosition?.x > boundaryRange?.max_x) {
            Notification.Error({
              msg: "Cannot exceeed right boundary",
            });
            return;
          }
          range = { ...boundaryRange, min_x: cameraPosition?.x };
        } else if (direction == "right") {
          if (cameraPosition?.x < boundaryRange?.min_x) {
            Notification.Error({
              msg: "Cannot exceeed left boundary",
            });
            return;
          }
          range = { ...boundaryRange, max_x: cameraPosition?.x };
        } else if (direction == "up") {
          if (cameraPosition?.y > boundaryRange?.min_y) {
            Notification.Error({
              msg: "Cannot exceeed bottom boundary",
            });
            return;
          }
          range = { ...boundaryRange, min_y: cameraPosition?.y };
        } else if (direction == "down") {
          if (cameraPosition?.y > boundaryRange?.max_y) {
            Notification.Error({
              msg: "Cannot exceeed top boundary",
            });
            return;
          }
          range = { ...boundaryRange, max_y: cameraPosition?.y };
        }
        const data = {
          ...boundaryPreset,
          meta: { ...boundaryPreset.meta, range: range },
        };
        const res = await Promise.resolve(
          dispatch(partialUpdateAssetBed(data, boundaryPreset.id as string))
        );
        if (res?.status === 200) {
          Notification.Success({
            msg: "Boundary Preset Modified Successfully",
          });
          setBed({});
          setNewPreset("");
          setRefreshPresetsHash(Number(new Date()));
        } else {
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
          setBed({});
          setNewPreset("");
          setRefreshPresetsHash(Number(new Date()));
          setBoundaryPresetExists(false);
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
      const res: any = await Promise.resolve(
        dispatch(
          createAssetBed(
            { meta: { ...data, ...presetData.data } },
            assetId,
            bed?.id as string
          )
        )
      );
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

  if (isLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <form className="bg-white rounded shadow p-8" onSubmit={handleSubmit}>
        <div className="grid gap-x-4 grid-cols-1 lg:grid-cols-2">
          <TextFormField
            name="middleware_hostname"
            label="Hospital Middleware Hostname"
            autoComplete="off"
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

      {assetType === "ONVIF" ? (
        <>
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
          <CameraBoundaryConfigure
            boundaryPreset={boundaryPreset}
            addBoundaryPreset={addBoundaryPreset}
            modifyBoundaryPreset={modifyBoundaryPreset}
            deleteBoundaryPreset={deleteBoundaryPreset}
            boundaryPresetExists={boundayPresetExists}
            direction={direction}
            setDirection={setDirection}
            bed={bed}
          />
        </>
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
