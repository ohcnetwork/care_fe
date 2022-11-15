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
  assetType: "",
  middlewareHostname: "",
  localipAddress: "",
};
const initError = { ...initForm };
const initialState = {
  form: { ...initForm },
  errors: { ...initError },
};
const hl7MonitiorFormReducer = (state = initialState, action: any) => {
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

const HL7Monitor = (props: HL7MonitorProps) => {
  const [state, dispatch_form] = useReducer(
    hl7MonitiorFormReducer,
    initialState
  );
  const { assetId, asset } = props;
  const [isLoading, setIsLoading] = React.useState(true);
  const [localipAddress, setLocalIPAddress] = React.useState("");
  const [ipadrdress_error, setIpAddress_error] = React.useState("");
  const dispatch = useDispatch<any>();
  useEffect(() => {
    initializeForm(
      asset?.asset_class,
      asset?.meta?.middleware_hostname,
      asset?.meta?.local_ip_address
    );
    setIsLoading(false);
  }, [asset]);

  const initializeForm = (
    asset_type: string,
    middleware_hostname: string,
    local_ip_address: string
  ) => {
    const form = { ...state.form };
    form["assetType"] = asset_type;
    form["middlewareHostname"] = middleware_hostname;
    form["localipAddress"] = local_ip_address;
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
          asset_type: form["assetType"],
          middleware_hostname: form["middlewareHostname"],
          local_ip_address: form["localipAddress"],
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
              <div className=" mt-2 grid gap-2 md:grid-cols-2 grid-cols-1">
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
                  <InputLabel id="local-ip-addess">Local IP Address</InputLabel>
                  <TextInputField
                    name="localipAddress"
                    id="local-ip-addess"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={state.form?.localipAddress}
                    onChange={handleChange}
                    errors={state.errors?.localipAddress}
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
      {state.form.assetType === "HL7MONITOR" ? (
        <MonitorConfigure asset={asset as AssetData} />
      ) : null}
    </div>
  );
};
export default HL7Monitor;
