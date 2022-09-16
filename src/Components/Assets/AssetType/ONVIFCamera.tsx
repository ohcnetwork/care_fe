import React, { useEffect, useReducer } from "react";
import {
  Card,
  CardContent,
  InputLabel,
  Button,
  Tooltip,
} from "@material-ui/core";
import { TextInputField } from "../../Common/HelperInputFields";
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

interface ONVIFCameraProps {
  assetId: string;
  asset: any;
}
const initForm = {
  middleware_hostname: {
    value: "",
    error: "",
  },
  localipAddress: {
    value: "",
    error: "",
  },
  cameraAccessKey: {
    value: "",
    error: "",
  },
};
const initialState = {
  form: { ...initForm },
};
const onvifCameraReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    default:
      return state;
  }
};

const ONVIFCamera = (props: ONVIFCameraProps) => {
  const [state, dispatch_form] = useReducer(onvifCameraReducer, initialState);
  const { assetId, asset } = props;
  const [isLoading, setIsLoading] = React.useState(true);
  const [assetType, setAssetType] = React.useState("");
  const [bed, setBed] = React.useState<BedModel>({});
  const [newPreset, setNewPreset] = React.useState("");
  const [refreshPresetsHash, setRefreshPresetsHash] = React.useState(
    Number(new Date())
  );
  const dispatch = useDispatch();

  useEffect(() => {
    setAssetType(asset?.asset_class);
    initializeForm(
      asset?.meta?.middleware_hostname,
      asset?.meta?.local_ip_address,
      asset?.meta?.camera_access_key
    );
    setIsLoading(false);
  }, [asset]);

  const initializeForm = (
    middleware_hostname: any,
    local_ip_address: any,
    camera_Access_Key: any
  ) => {
    let form = { ...state.form };
    form["middleware_hostname"].value = middleware_hostname;
    form["localipAddress"].value = local_ip_address;
    form["cameraAccessKey"].value = camera_Access_Key;
    dispatch_form({ type: "set_form", form });
  };

  const initializeError = () => {
    let form = { ...state.form };
    form["middleware_hostname"].error = "";
    form["localipAddress"].error = "";
    form["cameraAccessKey"].error = "";
    dispatch_form({ type: "set_form", form });
  };
  const setFieldError = (field: any, error_msg: any) => {
    let form = { ...state.form };
    form[field].error = error_msg;
    dispatch_form({ type: "set_form", form });
  };

  const isFormValid = () => {
    initializeError();
    let form = { ...state.form };
    if (
      form["middleware_hostname"].value.trim() !== "" &&
      form["localipAddress"].value.trim() !== "" &&
      form["cameraAccessKey"].value.trim() !== ""
    ) {
      if (checkIfValidIP(form["localipAddress"].value)) {
        return true;
      } else {
        setFieldError("localipAddress", "Please Enter a Valid IP address !!");
        return false;
      }
    } else {
      if (form["middleware_hostname"].value.trim() === "") {
        setFieldError("middleware_hostname", "This field cannot be empty!!");
      }
      if (form["localipAddress"].value.trim() === "") {
        setFieldError("localipAddress", "This field cannot be empty!!");
      }
      if (form["cameraAccessKey"].value.trim() === "") {
        setFieldError("cameraAccessKey", "This field cannot be empty!!");
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      let form = { ...state.form };
      const data = {
        meta: {
          asset_type: "CAMERA",
          middleware_hostname: form["middleware_hostname"].value,
          local_ip_address: form["localipAddress"].value,
          camera_access_key: form["cameraAccessKey"].value,
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
  const handleChange = (e: any) => {
    let form = { ...state.form };
    form[e.target.name] = {
      ...form[e.target.name],
      value: e.target.value,
    };
    dispatch_form({ type: "set_form", form });
  };
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
                  <TextInputField
                    name="middleware_hostname"
                    id="middleware-hostname"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form.middleware_hostname.value}
                    onChange={handleChange}
                    errors={state.form.middleware_hostname.error}
                  />
                </div>
                <div>
                  <InputLabel id="camera-addess">Local IP Address</InputLabel>
                  <TextInputField
                    name="localipAddress"
                    id="camera-addess"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form.localipAddress.value}
                    onChange={handleChange}
                    errors={state.form.localipAddress.error}
                  />
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
                  <TextInputField
                    name="cameraAccessKey"
                    id="camera-access-key"
                    variant="outlined"
                    margin="dense"
                    type="password"
                    value={state.form.cameraAccessKey.value}
                    onChange={handleChange}
                    errors={state.form.cameraAccessKey.error}
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
