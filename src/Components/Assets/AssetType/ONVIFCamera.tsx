import React, { useEffect } from "react";
import {
  Card,
  CardContent,
  InputLabel,
  Button,
  Tooltip,
} from "@material-ui/core";
import { ErrorHelperText } from "../../Common/HelperInputFields";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import { partialUpdateAsset, createAssetBed } from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import { BedModel } from "../../Facility/models";
import axios from "axios";
import { getCameraConfig } from "../../../Utils/transformUtils";
import CameraConfigure from "../configure/CameraConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";
import LegendInput from "../../../CAREUI/interactive/LegendInput";

interface ONVIFCameraProps {
  assetId: string;
  asset: any;
}

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const { assetId, asset } = props;
  const [isLoading, setIsLoading] = React.useState(true);
  const [assetType, setAssetType] = React.useState("");
  const [middlewareHostname, setMiddlewareHostname] = React.useState("");
  const [cameraAddress, setCameraAddress] = React.useState("");
  const [ipadrdress_error, setIpAddress_error] = React.useState("");
  const [cameraAccessKey, setCameraAccessKey] = React.useState("");
  const [bed, setBed] = React.useState<BedModel>({});
  const [newPreset, setNewPreset] = React.useState("");
  const [refreshPresetsHash, setRefreshPresetsHash] = React.useState(
    Number(new Date())
  );
  const dispatch = useDispatch<any>();

  useEffect(() => {
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setCameraAddress(asset?.meta?.local_ip_address);
    setCameraAccessKey(asset?.meta?.camera_access_key);
    setIsLoading(false);
  }, [asset]);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(cameraAddress)) {
      setIpAddress_error("");
      const data = {
        meta: {
          asset_type: "CAMERA",
          middleware_hostname: middlewareHostname,
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
    } else {
      setIpAddress_error("Please Enter a Valid Camera address !!");
    }
  };

  const addPreset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const config = getCameraConfig(asset as AssetData);
    const data = {
      bed_id: bed.id,
      preset_name: newPreset,
    };
    try {
      const presetData = await axios.get(
        `https://${asset?.meta?.middleware_hostname}/status?hostname=${config.hostname}&port=${config.port}&username=${config.username}&password=${config.password}`
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
                  <InputLabel id="middleware-hostname">
                    Hospital Middleware Hostname
                  </InputLabel>
                  <LegendInput
                    type="TEXT"
                    name="middleware-hostname"
                    id="middleware-hostname"
                    value={middlewareHostname}
                    onChange={(e) => setMiddlewareHostname(e.target.value)}
                    className="mt-2"
                  />
                </div>
                <div>
                  <InputLabel id="camera-addess">Local IP Address</InputLabel>
                  <LegendInput
                    type="TEXT"
                    name="camera-access-addess"
                    id="camera-access-addess"
                    value={cameraAddress}
                    onChange={(e) => setCameraAddress(e.target.value)}
                    error={ipadrdress_error !== ""}
                    className="mt-2"
                  />
                  <ErrorHelperText error={ipadrdress_error} />
                </div>
                <div>
                  <InputLabel id="camera-access-key">
                    Camera Access Key{" "}
                    <Tooltip
                      title={
                        <span className="text-sm font-semibold">
                          Camera Access Key format: username:password:uuid
                        </span>
                      }
                      placement="right-start"
                      arrow
                    >
                      <button className="rounded">
                        <i className="fa-solid fa-circle-question"></i>
                      </button>
                    </Tooltip>
                  </InputLabel>
                  <LegendInput
                    type="PASSWORD"
                    name="camera-access-key"
                    id="camera-access-key"
                    value={cameraAccessKey}
                    onChange={(e) => setCameraAccessKey(e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex justify-between mt-4">
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
                  fullWidth
                  className="w-full md:w-auto"
                  startIcon={<CheckCircleOutlineIcon></CheckCircleOutlineIcon>}
                  onClick={handleSubmit}
                >
                  Set Configuration
                </Button>
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
        />
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
