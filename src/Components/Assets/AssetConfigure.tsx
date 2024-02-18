import Loading from "../Common/Loading";
import HL7Monitor from "./AssetType/HL7Monitor";
import ONVIFCamera from "./AssetType/ONVIFCamera";
import Page from "../Common/components/Page";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

interface AssetConfigureProps {
  assetId: string;
  facilityId: string;
}

const AssetConfigure = ({ assetId, facilityId }: AssetConfigureProps) => {
  const {
    data: asset,
    loading,
    refetch,
  } = useQuery(routes.getAsset, { pathParams: { external_id: assetId } });

  if (loading || !asset) {
    return <Loading />;
  }

  if (asset.asset_class === "HL7MONITOR") {
    return (
      <Page
        title={`Configure HL7 Monitor: ${asset.name}`}
        crumbsReplacements={{
          [facilityId]: { name: asset.location_object.facility.name },
          assets: { uri: `/assets?facility=${facilityId}` },
          [assetId]: { name: asset?.name },
        }}
        backUrl={`/facility/${facilityId}/assets/${assetId}`}
      >
        <HL7Monitor asset={asset} assetId={assetId} facilityId={facilityId} />
      </Page>
    );
  }

  if (asset.asset_class === "VENTILATOR") {
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
      <ONVIFCamera
        asset={asset}
        assetId={assetId}
        facilityId={facilityId}
        onUpdated={() => refetch()}
      />
    </Page>
  );
};

export default AssetConfigure;
