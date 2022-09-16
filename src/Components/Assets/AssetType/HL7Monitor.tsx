import React, { useEffect, useReducer } from "react";
import { Card, CardContent, InputLabel, Button } from "@material-ui/core";
import { TextInputField } from "../../Common/HelperInputFields";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { AssetData } from "../AssetTypes";
import { useDispatch } from "react-redux";
import { partialUpdateAsset } from "../../../Redux/actions";
import * as Notification from "../../../Utils/Notifications.js";
import MonitorConfigure from "../configure/MonitorConfigure";
import Loading from "../../Common/Loading";
import { checkIfValidIP } from "../../../Common/validation";

interface HL7MonitorProps {
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
};
const initialState = {
  form: { ...initForm },
};
const hl7MonitiorFormReducer = (state = initialState, action: any) => {
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

const HL7Monitor = (props: HL7MonitorProps) => {
  const [state, dispatch_form] = useReducer(
    hl7MonitiorFormReducer,
    initialState
  );
  const { assetId, asset } = props;
  const [assetType, setAssetType] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const dispatch = useDispatch();
  useEffect(() => {
    setAssetType(asset?.asset_class);
    initializeForm(
      asset?.meta?.middleware_hostname,
      asset?.meta?.local_ip_address
    );
    setIsLoading(false);
  }, [asset]);

  const initializeForm = (middleware_hostname: any, local_ip_address: any) => {
    let form = { ...state.form };
    form["middleware_hostname"].value = middleware_hostname;
    form["localipAddress"].value = local_ip_address;
    dispatch_form({ type: "set_form", form });
  };

  const initializeError = () => {
    let form = { ...state.form };
    form["middleware_hostname"].error = "";
    form["localipAddress"].error = "";
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
      form["localipAddress"].value.trim() !== ""
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
      return false;
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      let form = { ...state.form };
      const data = {
        meta: {
          asset_type: assetType,
          middleware_hostname: form["middleware_hostname"].value,
          local_ip_address: form["localipAddress"].value,
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
              <div className=" mt-2 grid gap-2 md:grid-cols-2 grid-cols-1">
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
                  <InputLabel id="local-ip-addess">Local IP Address</InputLabel>
                  <TextInputField
                    name="localipAddress"
                    id="local-ip-addess"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form.localipAddress.value}
                    onChange={handleChange}
                    errors={state.form.localipAddress.error}
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
      {assetType === "HL7MONITOR" ? (
        <MonitorConfigure asset={asset as AssetData} />
      ) : null}
    </div>
  );
};
export default HL7Monitor;
