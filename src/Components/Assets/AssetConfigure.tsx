import React, { useCallback } from "react";
import Loading from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { AssetData } from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import { getAsset } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";

interface AssetConfigureProps {
  assetId: string;
}

const AssetConfigure = (props: AssetConfigureProps) => {
  const { assetId } = props;
  const [asset, setAsset] = React.useState<AssetData>();
  const [isLoading, setIsLoading] = React.useState(true);
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

  if (isLoading) return <Loading />;
  return (
    <div>
      <PageTitle
        title={`Configure asset: ${asset?.name}`}
        crumbsReplacements={{ [assetId]: { name: asset?.name } }}
      />
      Configure Asset
    </div>
  );
};

export default AssetConfigure;
