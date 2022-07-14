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
import Monitorsvg from "../AssetIcons/Monitorsvg";

interface HL7MonitorProps {
  assetId: string;
  asset: any;
}

const HL7Monitor = (props: HL7MonitorProps) => {
  const { assetId, asset } = props;
  const [assetType, setAssetType] = React.useState("");
  const [middlewareHostname, setMiddlewareHostname] = React.useState("");
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

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (checkIfValidIP(localipAddress)) {
      setIpAddress_error("");
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
    } else {
      setIpAddress_error("Please Enter a Valid IP address !!");
    }
  };
  if (isLoading) return <Loading />;
  return (
    <div>
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <CardContent>
              <div className="mt-2 grid grid-cols-1 lg:grid-cols-2">
                <div className="text-primary-500 m-auto">
                  <Monitorsvg
                    className="h-64 w-64"
                    viewBox="0 0 122.88 78.97"
                    fill="currentColor"
                  />
                </div>
                <div className=" mt-2 grid gap-2 grid-cols-1 col-span-1">
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
                      errors=""
                    />
                  </div>
                  <div>
                    <InputLabel id="local-ip-addess">
                      Local IP Address
                    </InputLabel>
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
              </div>
              <div className="flex justify-between mt-4">
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto" }}
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
