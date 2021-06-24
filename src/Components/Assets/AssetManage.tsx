import React from "react";
import loadable from "@loadable/component";
import { useState, useCallback } from "react";
import { AssetData } from "./AssetTypes";
import * as Notification from "../../Utils/Notifications.js";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch, useSelector } from "react-redux";
import { Typography } from "@material-ui/core";
import { getAsset } from "../../Redux/actions";
import { useEffect } from "react";
import { navigate } from "raviger";
const PageTitle = loadable(() => import("../Common/PageTitle"));
const Loading = loadable(() => import("../Common/Loading"));

interface AssetManageProps {
  assetId: string;
}

const AssetManage = (props: AssetManageProps) => {
  const { assetId } = props;
  const [asset, setAsset] = useState<AssetData>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dispatch = useDispatch();

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const { data }: any = await dispatch(getAsset(assetId));
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          console.log(data);
          setAsset(data);
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

  if (isLoading) {
    return <Loading />;
  }

  const working_status = (is_working: boolean | undefined) => {
    if (is_working)
      return (
        <span className="bg-green-500 text-white text-sm px-2 py-1 uppercase rounded-full">
          Working
        </span>
      );
    return (
      <span className="bg-red-500 text-white text-sm px-2 py-1 uppercase rounded-full">
        Not Working
      </span>
    );
  };

  const status = (
    asset_status: "ACTIVE" | "TRANSFER_IN_PROGRESS" | undefined
  ) => {
    if (asset_status === "ACTIVE") {
      return (
        <span className="bg-green-500 text-white text-sm px-2 py-1 uppercase rounded-full">
          ACTIVE
        </span>
      );
    }
    return (
      <span className="bg-yellow-500 text-white text-sm px-2 py-1 uppercase rounded-full">
        TRANSFER IN PROGRESS
      </span>
    );
  };

  return (
    <div className="px-2 pb-2">
      <PageTitle title={asset?.name || "Asset"} />
      <div className="bg-white rounded-lg md:p-6 p-3 shadow">
        <div className="md:flex justify-between">
          <div className="mb-2">
            <div className="text-xl font-semibold">
              {asset?.name} ({asset?.location_object.facility.name})
            </div>
            <Typography>Location : {asset?.location_object.name}</Typography>
            <Typography>
              Facility : {asset?.location_object.facility.name}
            </Typography>
            <Typography>Serial Number : {asset?.serial_number}</Typography>
            <Typography>Status : {status(asset?.status)}</Typography>
            <Typography>
              Warranty Details : {asset?.warranty_details}
            </Typography>
            <Typography>Type : {asset?.asset_type}</Typography>
            <Typography>
              Working status : {working_status(asset?.is_working)}
            </Typography>
          </div>
          <div className="flex flex-col">
            <button
              onClick={() =>
                navigate(
                  `/facility/${asset?.location_object.facility.id}/assets/${asset?.id}`
                )
              }
              id="update-asset"
              className="btn-primary btn"
            >
              <i className="fas fa-pencil-alt text-white mr-2"></i>
              Update Asset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssetManage;
