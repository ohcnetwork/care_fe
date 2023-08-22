import { useCallback, useState } from "react";
import Loading from "../Common/Loading";
import { AssetData } from "./AssetTypes";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { useDispatch } from "react-redux";
import { getAsset } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications.js";
import HL7Monitor from "./AssetType/HL7Monitor";
import ONVIFCamera from "./AssetType/ONVIFCamera";
import Page from "../Common/components/Page";

interface AssetConfigureProps {
  assetId: string;
  facilityId: string;
}

const AssetConfigure = (props: AssetConfigureProps) => {
  const { assetId, facilityId } = props;
  const [asset, setAsset] = useState<AssetData>();
  const [isLoading, setIsLoading] = useState(true);
  const [assetType, setAssetType] = useState("");
  const dispatch = useDispatch<any>();

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
          setAssetType(assetData.data.asset_class);
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

  if (assetType === "HL7MONITOR") {
    return (
      <Page
        title={`Configure HL7 Monitor: ${asset?.name}`}
        crumbsReplacements={{
          [facilityId]: { name: asset?.location_object.facility.name },
          assets: { uri: `/assets?facility=${facilityId}` },
          [assetId]: { name: asset?.name },
        }}
        backUrl={`/facility/${facilityId}/assets/${assetId}`}
      >
        <HL7Monitor asset={asset} assetId={assetId} facilityId={facilityId} />
      </Page>
    );
  }

  if (assetType === "VENTILATOR") {
    return (
      <Page
        title={`Configure Ventilator: ${asset?.name}`}
        crumbsReplacements={{
          [facilityId]: { name: asset?.location_object.facility.name },
          assets: { uri: `/assets?facility=${facilityId}` },
          [assetId]: { name: asset?.name },
        }}
        backUrl={`/facility/${facilityId}/assets/${assetId}`}
      >
        <HL7Monitor asset={asset} assetId={assetId} facilityId={facilityId} />
      </Page>
    );
  }

  return (
    <Page
      title={`Configure ONVIF Camera: ${asset?.name}`}
      crumbsReplacements={{
        [facilityId]: { name: asset?.location_object.facility.name },
        assets: { uri: `/assets?facility=${facilityId}` },
        [assetId]: { name: asset?.name },
      }}
      backUrl={`/facility/${facilityId}/assets/${assetId}`}
    >
      <ONVIFCamera asset={asset} assetId={assetId} facilityId={facilityId} />
    </Page>
  );
};

export default AssetConfigure;
