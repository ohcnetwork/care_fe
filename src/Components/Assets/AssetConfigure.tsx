import React, { useCallback } from "react";
import Loading from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { AssetData } from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import CheckCircleOutlineIcon from "@material-ui/icons/CheckCircleOutline";
import { useDispatch } from "react-redux";
import { getAsset, partialUpdateAsset } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import { Card, CardContent, InputLabel, Button } from "@material-ui/core";
import { SelectField, TextInputField } from "../Common/HelperInputFields";
import { ASSET_META_TYPE, CAMERA_TYPE } from "../../Common/constants";
import LiveFeed from "../Facility/Consultations/LiveFeed";

interface AssetConfigureProps {
  assetId: string;
}

const AssetConfigure = (props: AssetConfigureProps) => {
  const { assetId } = props;
  const [asset, setAsset] = React.useState<AssetData>();
  const [isLoading, setIsLoading] = React.useState(true);
  const [assetType, setAssetType] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [middlewareHostname, setMiddlewareHostname] = React.useState("");
  const [cameraType, setCameraType] = React.useState("");
  const [cameraAddress, setCameraAddress] = React.useState("");
  const [cameraAccessKey, setCameraAccessKey] = React.useState("");
  const dispatch = useDispatch();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const [assetData]: any = await Promise.all([dispatch(getAsset(assetId))]);
      if (!status.aborted) {
        setIsLoading(false);
        if (!assetData.data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAsset(assetData.data);
          setAssetType(assetData.data.meta?.asset_type);
          setLocation(assetData.data.meta?.location);
          setMiddlewareHostname(assetData.data.meta?.middleware_hostname);
          setCameraType(assetData.data.meta?.camera_type);
          setCameraAddress(assetData.data.meta?.camera_address);
          setCameraAccessKey(assetData.data.meta?.camera_access_key);
        }
      }
    },
    [dispatch, assetId]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    const data = {
      meta: {
        asset_type: assetType,
        location: location,
        middleware_hostname: middlewareHostname,
        camera_type: cameraType,
        camera_address: cameraAddress,
        camera_access_key: cameraAccessKey,
      },
    };
    let res: any = await Promise.resolve(
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
  };

  if (isLoading) return <Loading />;
  return (
    <div>
      <PageTitle
        title={`Configure asset: ${asset?.name}`}
        crumbsReplacements={{ [assetId]: { name: asset?.name } }}
      />
      <Card>
        <form onSubmit={handleSubmit}>
          <CardContent>
            <div className="mt-2 grid gap-4 grid-cols-1 md:grid-cols-2">
              <div>
                <InputLabel id="asset-type">Asset Type</InputLabel>
                <SelectField
                  name="asset_type"
                  id="asset-type"
                  variant="outlined"
                  margin="dense"
                  options={[
                    { id: "", text: "Select Asset Type" },
                    ...ASSET_META_TYPE,
                  ]}
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value)}
                  optionValue="text"
                />
              </div>
              <div>
                <InputLabel id="location">Location</InputLabel>
                <TextInputField
                  name="name"
                  id="location"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  errors=""
                />
              </div>
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
                <InputLabel id="camera-type">Camera Type</InputLabel>
                <SelectField
                  name="camera_type"
                  id="camera-type"
                  variant="outlined"
                  margin="dense"
                  options={[
                    { id: "", text: "Select Camera Type" },
                    ...CAMERA_TYPE,
                  ]}
                  value={cameraType}
                  onChange={(e) => setCameraType(e.target.value)}
                />
              </div>
              <div>
                <InputLabel id="camera-addess">Camera Address</InputLabel>
                <TextInputField
                  name="name"
                  id="camera-addess"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={cameraAddress}
                  onChange={(e) => setCameraAddress(e.target.value)}
                  errors=""
                />
              </div>
              <div>
                <InputLabel id="camera-access-key">
                  Camera Access Key
                </InputLabel>
                <TextInputField
                  name="name"
                  id="camera-access-key"
                  variant="outlined"
                  margin="dense"
                  type="password"
                  value={cameraAccessKey}
                  onChange={(e) => setCameraAccessKey(e.target.value)}
                  errors=""
                />
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
      </Card>
      <Card>
        <CardContent>
          {asset?.meta?.asset_type === "CAMERA" && <LiveFeed />}
        </CardContent>
      </Card>
    </div>
  );
};

export default AssetConfigure;
