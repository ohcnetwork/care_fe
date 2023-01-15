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
import CareIcon from "../../../CAREUI/icons/CareIcon";

interface ONVIFCameraProps {
  assetId: string;
  facilityId: string;
  asset: any;
}

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const { assetId, facilityId, asset } = props;
  const [isLoading, setIsLoading] = useState(true);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [assetType, setAssetType] = useState("");
  const [middlewareHostname, setMiddlewareHostname] = useState("");
  const [middlewareHostnameError, setMiddlewareHostnameError] = useState("");
  const [facilityMiddlewareHostname, setFacilityMiddlewareHostname] =
    useState("");
  const [cameraAddress, setCameraAddress] = useState("");
  const [ipadrdress_error, setIpAddress_error] = useState("");
  const [cameraAccessKeyError, setCameraAccessKeyError] = useState("");
  const [cameraAccessKey, setCameraAccessKey] = useState("");
  const [bed, setBed] = useState<BedModel>({});
  const [newPreset, setNewPreset] = useState("");
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

  const isFormValid = () => {
    if (middlewareHostname.trim() === "" || !middlewareHostname) {
      setMiddlewareHostnameError("Please enter the Middleware Hostname");
      return false;
    }
    if (cameraAddress.trim() === "" || !cameraAddress) {
      setIpAddress_error("Please enter the Local IP Adress");
      return false;
    }
    if (!checkIfValidIP(cameraAddress)) {
      setIpAddress_error("Please enter a valid IP Adress");
      return false;
    }
    if (cameraAccessKey === "" || !cameraAccessKey) {
      setCameraAccessKeyError("Please enter the Camera Access Key");
      return false;
    }
    setMiddlewareHostnameError("");
    setIpAddress_error("");
    setCameraAccessKeyError("");
    return true;
  };

  const handleSubmit = async (e: SyntheticEvent) => {
    setIsConfiguring(true);
    e.preventDefault();
    console.log(isFormValid(), "hiii");
    if (isFormValid()) {
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
        setIsConfiguring(false);
        window.location.reload();
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
        setIsConfiguring(false);
      }
    }
    setIsConfiguring(false);
  };

  const addPreset = async (e: SyntheticEvent) => {
    e.preventDefault();
    const config = getCameraConfig(asset as AssetData);
    const data = {
      bed_id: bed.id,
      preset_name: newPreset,
    };
    try {
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
                  <TextFormField
                    name="middleware-hostname"
                    id="middleware-hostname"
                    required
                    label="Hospital Middleware Hostname"
                    type="text"
                    autoComplete="off"
                    value={middlewareHostname}
                    onChange={(e) => setMiddlewareHostname(e.value)}
                    className="mt-2"
                    error={middlewareHostnameError}
                  />
                </div>
                <div>
                  <TextFormField
                    name="camera-access-addess"
                    id="camera-access-addess"
                    required
                    type="text"
                    label="Local IP Address"
                    autoComplete="new-addess"
                    value={cameraAddress}
                    onChange={(e) => setCameraAddress(e.value)}
                    className="mt-2"
                    error={ipadrdress_error}
                  />
                </div>
                <div>
                  <TextFormField
                    name="camera-access-key"
                    id="camera-access-key"
                    type="password"
                    label={
                      <div>
                        {" "}
                        Camera Access Key{" "}
                        <span className="text-red-500">*</span>
                        <button className="tooltip ml-2">
                          <span className="tooltip-text tooltip-right">
                            <span className="text-sm font-semibold">
                              Camera Access Key format: username:password:uuid
                            </span>
                          </span>
                          <button className="rounded">
                            <CareIcon className="care-l-question-circle text-xl" />
                          </button>
                        </button>
                      </div>
                    }
                    autoComplete="new-password" // Chrome ignores autocomplete=off for password fields
                    value={cameraAccessKey}
                    onChange={(e) => setCameraAccessKey(e.value)}
                    className="mt-2"
                    error={cameraAccessKeyError}
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Submit
                  className="w-full md:w-auto ml-auto"
                  onClick={handleSubmit}
                >
                  {isConfiguring ? (
                    <CareIcon className="care-l-spinner animate-spin text-xl" />
                  ) : (
                    <CareIcon className="care-l-check-circle text-xl" />
                  )}
                  <span>
                    {isConfiguring ? "Configuring..." : "Set Configuration"}
                  </span>
                </Submit>
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
          refreshPresetsHash={refreshPresetsHash}
          facilityMiddlewareHostname={facilityMiddlewareHostname}
        />
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
