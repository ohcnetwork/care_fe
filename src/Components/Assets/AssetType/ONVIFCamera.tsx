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
  assetType: "",
  middlewareHostname: "",
  localipAddress: "",
  cameraAccessKey: "",
};
const initError = { ...initForm };
const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};
const onvifCameraReducer = (state = initialState, action: any) => {
  switch (action.type) {
    case "set_form": {
      return {
        ...state,
        form: action.form,
      };
    }
    case "set_error": {
      return {
        ...state,
        errors: action.errors,
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
  const [bed, setBed] = React.useState<BedModel>({});
  const [newPreset, setNewPreset] = React.useState("");
  const [bedError, setBedError] = React.useState("");
  const [presetNameError, setpresetNameError] = React.useState("");
  const [refreshPresetsHash, setRefreshPresetsHash] = React.useState(
    Number(new Date())
  );
  const dispatch = useDispatch();

  useEffect(() => {
    initializeForm(
      asset?.asset_class,
      asset?.meta?.middleware_hostname,
      asset?.meta?.local_ip_address,
      asset?.meta?.camera_access_key
    );
    setIsLoading(false);
  }, [asset]);

  const initializeForm = (
    asset_type: string,
    middleware_hostname: string,
    local_ip_address: string,
    camera_Access_Key: string
  ) => {
    const form = { ...state.form };
    form["assetType"] = asset_type;
    form["middlewareHostname"] = middleware_hostname;
    form["localipAddress"] = local_ip_address;
    form["cameraAccessKey"] = camera_Access_Key;
    dispatch_form({ type: "set_form", form });
  };

  const isFormValid = () => {
    const form = { ...state.form };
    const errors = { ...initError };
    let invalidForm = false;

    Object.keys(state.form).forEach((field) => {
      switch (field) {
        case "assetType":
        case "middlewareHostname":
          if (!state.form[field] || state.form[field].trim() === "") {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "cameraAccessKey":
          if (!state.form[field] || state.form[field].trim() === "") {
            errors[field] = "Field is required";
            invalidForm = true;
          }
          return;
        case "localipAddress":
          if (!state.form[field] || state.form[field].trim() === "") {
            errors[field] = "Field is required";
            invalidForm = true;
          } else {
            if (!checkIfValidIP(form[field])) {
              errors[field] = "Please Enter a Valid IP address !!";
              invalidForm = true;
            }
          }
          return;
      }
    });
    dispatch_form({ type: "set_error", errors });
    return !invalidForm;
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      const form = { ...state.form };
      const data = {
        meta: {
          asset_type: "CAMERA",
          middleware_hostname: form["middlewareHostname"],
          local_ip_address: form["localipAddress"],
          camera_access_key: form["cameraAccessKey"],
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
  const isCameraConfigureFormValid = (bed: BedModel, preset_name: string) => {
    let result = true;
    if (bed) {
      setBedError("");
    } else {
      setBedError("Please choose a bed !");
      result = false;
    }
    if (preset_name.trim()) {
      setpresetNameError("");
    } else {
      setpresetNameError("Please enter a valid preset name !");
      result = false;
    }
    return result;
  };
  const addPreset = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isCameraConfigureFormValid(bed, newPreset)) {
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
    }
  };
  if (isLoading) return <Loading />;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = { ...state.form };
    form[e.target.name] = e.target.value;
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
                    name="middlewareHostname"
                    id="middleware-hostname"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form?.middlewareHostname}
                    onChange={handleChange}
                    errors={state.errors?.middlewareHostname}
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
                    value={state.form?.localipAddress}
                    onChange={handleChange}
                    errors={state.errors?.localipAddress}
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
                    value={state.form?.cameraAccessKey}
                    onChange={handleChange}
                    errors={state.errors?.cameraAccessKey}
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

      {state.form.assetType === "ONVIF" ? (
        <CameraConfigure
          asset={asset as AssetData}
          bed={bed}
          setBed={setBed}
          newPreset={newPreset}
          setNewPreset={setNewPreset}
          addPreset={addPreset}
          refreshPresetsHash={refreshPresetsHash}
          bedError={bedError}
          presetNameError={presetNameError}
          setBedError={setBedError}
          setpresetNameError={setpresetNameError}
        />
      ) : null}
    </div>
  );
};
export default ONVIFCamera;
