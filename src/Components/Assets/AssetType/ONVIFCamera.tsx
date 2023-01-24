import { useEffect, useState } from "react";
import { Card, CardContent } from "@material-ui/core";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import {
  partialUpdateAsset,
  createAssetBed,
  getPermittedFacility,
} from "../../../Redux/actions";
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

interface ONVIFCameraProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const { assetId, facilityId, asset } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [facilityMiddlewareHostname, setFacilityMiddlewareHostname] =
    useState("");
  const [cameraAddress, setCameraAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const [cameraAccessKey, setCameraAccessKey] = useState("");
  const [bed, setBed] = useState<BedModel>({});
  const [newPreset, setNewPreset] = useState("");
  const [loadingAddPreset, setLoadingAddPreset] = useState(false);
  const [loadingSetConfiguration, setLoadingSetConfiguration] = useState(false);
  const [refreshPresetsHash, setRefreshPresetsHash] = useState(
    Number(new Date())
  );
  const dispatch = useDispatch<any>();

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
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setCameraAddress(asset?.meta?.local_ip_address);
    setCameraAccessKey(asset?.meta?.camera_access_key);
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
          camera_access_key: cameraAccessKey,
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
      setLoadingAddPreset(false);
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
  };
  if (isLoading) return <Loading />;
  return (
    <div>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="mt-2 grid gap-4 grid-cols-1 lg:grid-cols-2 col-span-1">
                <div>
                  <label id="middleware-hostname">
                    Hospital Middleware Hostname
                  </label>
                  <TextFormField
                    name="middleware-hostname"
                    id="middleware-hostname"
                    type="text"
                    autoComplete="off"
                    value={middlewareHostname}
                    onChange={(e) => setMiddlewareHostname(e.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <label id="camera-addess">Local IP Address</label>
                  <TextFormField
                    name="camera-access-addess"
                    id="camera-access-addess"
                    type="text"
                    autoComplete="new-addess"
                    value={cameraAddress}
                    onChange={(e) => setCameraAddress(e.value)}
                    className="mt-2"
                    error={ipadrdress_error}
                  />
                </div>
                <div>
                  <label id="camera-access-key">
                    Camera Access Key{" "}
                    <button className="tooltip">
                      <span className="tooltip-text tooltip-right">
                        <span className="text-sm font-semibold">
                          Camera Access Key format: username:password:uuid
                        </span>
                      </span>
                      <button className="rounded">
                        <i className="fa-solid fa-circle-question"></i>
                      </button>
                    </button>
                  </label>
                  <TextFormField
                    name="camera-access-key"
                    id="camera-access-key"
                    type="password"
                    autoComplete="new-password" // Chrome ignores autocomplete=off for password fields
                    value={cameraAccessKey}
                    onChange={(e) => setCameraAccessKey(e.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Submit
                  className="w-full md:w-auto ml-auto"
                  onClick={handleSubmit}
                  disabled={loadingSetConfiguration}
                  label="Set Configuration"
                />
              </div>
            </CardContent>
          </form>
        </CardContent>
      </Card>

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
