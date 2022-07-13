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
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2">
                <div className="text-primary-500 m-auto">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-64 w-64"
                    viewBox="0 0 64 64"
                    fill="currentColor"
                  >
                    <path d="M 3 6 C 1.346 6 0 7.346 0 9 L 0 57 C 0 58.654 1.346 60 3 60 L 61 60 C 62.654 60 64 58.654 64 57 L 64 9 C 64 7.346 62.654 6 61 6 L 3 6 z M 3 8 L 61 8 C 61.551 8 62 8.449 62 9 L 62 57 C 62 57.551 61.551 58 61 58 L 3 58 C 2.449 58 2 57.551 2 57 L 2 9 C 2 8.449 2.449 8 3 8 z M 5 12 C 4.448 12 4 12.448 4 13 C 4 13.552 4.448 14 5 14 L 7 14 C 7.552 14 8 13.552 8 13 C 8 12.448 7.552 12 7 12 L 5 12 z M 12 12 C 10.897 12 10 12.897 10 14 L 10 52 C 10 53.103 10.897 54 12 54 L 56 54 C 57.103 54 58 53.103 58 52 L 58 14 C 58 12.897 57.103 12 56 12 L 12 12 z M 12 14 L 56 14 L 56.001953 52 L 12 52 L 12 34 L 22 34 C 22.431 34 22.812219 33.725406 22.949219 33.316406 L 23.863281 30.574219 L 26.029297 39.242188 C 26.142297 39.696188 26.537437 40.042047 27.023438 39.998047 C 27.490437 39.987047 27.888469 39.653312 27.980469 39.195312 L 30.701172 25.59375 L 33.005859 47.105469 C 33.057859 47.596469 33.462078 47.975047 33.955078 47.998047 C 33.970078 47.999047 33.985 48 34 48 C 34.474 48 34.886469 47.664313 34.980469 47.195312 L 38.107422 31.556641 L 40.029297 39.242188 C 40.137297 39.673187 40.516937 39.982047 40.960938 39.998047 C 41.402938 40.032047 41.807266 39.736453 41.947266 39.314453 L 43.720703 34 L 48.277344 34 C 48.624344 34.595 49.263 35 50 35 C 51.103 35 52 34.103 52 33 C 52 31.897 51.103 31 50 31 C 49.263 31 48.624344 31.405 48.277344 32 L 43 32 C 42.569 32 42.187781 32.274594 42.050781 32.683594 L 41.136719 35.425781 L 38.970703 26.757812 C 38.857703 26.303812 38.474562 25.983953 37.976562 26.001953 C 37.509563 26.012953 37.111531 26.346687 37.019531 26.804688 L 34.298828 40.40625 L 31.994141 18.894531 C 31.942141 18.403531 31.537922 18.024953 31.044922 18.001953 C 30.537922 17.984953 30.116531 18.320687 30.019531 18.804688 L 26.890625 34.443359 L 24.970703 26.757812 C 24.862703 26.326812 24.481109 26.017953 24.037109 26.001953 C 23.596109 25.975953 23.191781 26.263547 23.050781 26.685547 L 21.279297 32 L 12 32 L 12 14 z M 5 17 C 4.448 17 4 17.448 4 18 C 4 18.552 4.448 19 5 19 L 7 19 C 7.552 19 8 18.552 8 18 C 8 17.448 7.552 17 7 17 L 5 17 z M 5 22 C 4.448 22 4 22.448 4 23 C 4 23.552 4.448 24 5 24 L 7 24 C 7.552 24 8 23.552 8 23 C 8 22.448 7.552 22 7 22 L 5 22 z M 5 27 C 4.448 27 4 27.448 4 28 C 4 28.552 4.448 29 5 29 L 7 29 C 7.552 29 8 28.552 8 28 C 8 27.448 7.552 27 7 27 L 5 27 z M 5 32 C 4.448 32 4 32.448 4 33 C 4 33.552 4.448 34 5 34 L 7 34 C 7.552 34 8 33.552 8 33 C 8 32.448 7.552 32 7 32 L 5 32 z M 5 37 C 4.448 37 4 37.448 4 38 C 4 38.552 4.448 39 5 39 L 7 39 C 7.552 39 8 38.552 8 38 C 8 37.448 7.552 37 7 37 L 5 37 z M 5 42 C 4.448 42 4 42.448 4 43 C 4 43.552 4.448 44 5 44 L 7 44 C 7.552 44 8 43.552 8 43 C 8 42.448 7.552 42 7 42 L 5 42 z M 5 47 C 4.448 47 4 47.448 4 48 C 4 48.552 4.448 49 5 49 L 7 49 C 7.552 49 8 48.552 8 48 C 8 47.448 7.552 47 7 47 L 5 47 z M 5 52 C 4.448 52 4 52.448 4 53 C 4 53.552 4.448 54 5 54 L 7 54 C 7.552 54 8 53.552 8 53 C 8 52.448 7.552 52 7 52 L 5 52 z" />
                  </svg>
                </div>
                <div className=" mt-2 grid gap-2 grid-cols-1">
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
