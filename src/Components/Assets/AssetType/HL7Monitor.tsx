import React, { useEffect } from "react";
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

const HL7Monitor = (props: HL7MonitorProps) => {
  const { assetId, asset } = props;
  const [assetType, setAssetType] = React.useState("");
  const [middlewareHostname, setMiddlewareHostname] = React.useState("");
  const [middlewareHostname_error, setMiddlewareHostname_error] =
    React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [localipAddress, setLocalIPAddress] = React.useState("");
  const [ipadrdress_error, setIpAddress_error] = React.useState("");
  const dispatch = useDispatch();
  useEffect(() => {
    setAssetType(asset?.asset_class);
    setMiddlewareHostname(asset?.meta?.middleware_hostname);
    setLocalIPAddress(asset?.meta?.local_ip_address);
    setIsLoading(false);
  }, [asset]);

  const isFormValid = () => {
    setMiddlewareHostname_error("");
    setIpAddress_error("");
    if (middlewareHostname.trim() !== "" && localipAddress.trim() !== "") {
      if (checkIfValidIP(localipAddress)) {
        return true;
      } else {
        setIpAddress_error("Please Enter a Valid IP address !!");
        return false;
      }
    } else {
      if (middlewareHostname.trim() === "") {
        setMiddlewareHostname_error("This field cannot be empty!!");
      }
      if (localipAddress.trim() === "") {
        setIpAddress_error("This field cannot be empty!!");
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (isFormValid()) {
      const data = {
        meta: {
          asset_type: assetType,
          middleware_hostname: middlewareHostname,
          local_ip_address: localipAddress,
        },
      };
      const res: any = await Promise.resolve(
        dispatch(partialUpdateAsset(assetId, data))
      );
      if (res?.status === 200) {
        Notification.Success({
          msg: "Asset Configured Successfully",
        });
      } else {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    }
  };
  if (isLoading) return <Loading />;
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
                    name="name"
                    id="middleware-hostname"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={middlewareHostname}
                    onChange={(e) => setMiddlewareHostname(e.target.value)}
                    errors={middlewareHostname_error}
                  />
                </div>
                <div>
                  <InputLabel id="local-ip-addess">Local IP Address</InputLabel>
                  <TextInputField
                    name="name"
                    id="local-ip-addess"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    value={localipAddress}
                    onChange={(e) => setLocalIPAddress(e.target.value)}
                    errors={ipadrdress_error}
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
