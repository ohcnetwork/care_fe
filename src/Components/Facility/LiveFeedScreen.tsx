import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import useFilters from "../../Common/hooks/useFilters";
import { statusType, useAbortableEffect } from "../../Common/utils";
import CountBlock from "../../CAREUI/display/Count";
import * as Notification from "../../Utils/Notifications.js";
import { listAssetBeds } from "../../Redux/actions";
import { AssetData } from "../Assets/AssetTypes";
import LiveFeedTile from "../Hub/LiveFeedTile";

interface Props {
  facilityId: string;
}

function LiveFeedScreen({ facilityId }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [assetList, setAssetList] = useState<AssetData[] | []>([]);
  const dispatch: any = useDispatch();
  const { qParams, resultsPerPage } = useFilters({
    limit: 18,
  });
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const params = {
        limit: resultsPerPage,
        page: qParams.page,
        offset: (qParams.page ? qParams.page - 1 : 0) * resultsPerPage,
        facility: facilityId,
      };
      const { data } = await dispatch(listAssetBeds(params));
      const assets: AssetData[] = data.results
        .map((asset: any) => asset.asset_object)
        .filter((asset: any) => asset.asset_class === "ONVIF");
      const uniqueAssets = assets.filter(
        (asset: any, index: number, self: any) =>
          index === self.findIndex((t: any) => t.id === asset.id)
      );
      if (!status.aborted) {
        setIsLoading(false);
        if (!data)
          Notification.Error({
            msg: "Something went wrong..!",
          });
        else {
          setAssetList(uniqueAssets);
          setTotalCount(uniqueAssets.length);
          console.log(data.results);
        }
      }
    },
    [
      resultsPerPage,
      qParams.page,
      qParams.search,
      qParams.facility,
      qParams.asset_type,
      qParams.asset_class,
      qParams.location,
      qParams.status,
      dispatch,
    ]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData]
  );

  return (
    <div>
      LiveFeedScreen
      <CountBlock
        text="Total Cameras"
        count={totalCount}
        loading={isLoading}
        icon={"video"}
      />
      {assetList.map((asset: any) => (
        <LiveFeedTile assetId={asset.id} />
      ))}
    </div>
  );
}

export default LiveFeedScreen;
