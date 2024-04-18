import { lazy, useState } from "react";
import { ConsultationTabProps } from "./index";
import { AssetBedModel, AssetData } from "../../Assets/AssetTypes";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import CameraFeed from "../../CameraFeed/CameraFeed";
import Loading from "../../Common/Loading";
import AssetBedSelect from "../../CameraFeed/AssetBedSelect";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  const bed = props.consultationData.current_bed?.bed_object;

  const [asset, setAsset] = useState<AssetData>();
  const [preset, setPreset] = useState<AssetBedModel>();

  const { loading } = useQuery(routes.listAssetBeds, {
    query: { bed: bed?.id },
    prefetch: !!bed,
    onResponse: ({ data }) => {
      if (!data) {
        return;
      }

      const preset = data.results.find(
        (obj) =>
          obj.asset_object.meta?.asset_type === "CAMERA" &&
          obj.meta.type !== "boundary",
      );

      if (preset) {
        setPreset(preset);
        setAsset(preset.asset_object);
      }
    },
  });

  if (!bed) {
    return <span>No bed allocated</span>;
  }

  console.log("pos", preset?.meta);

  return (
    <div>
      <PageTitle
        title="Camera Feed"
        breadcrumbs={false}
        hideBack={true}
        focusOnLoad={true}
      />
      {loading || !asset ? (
        <Loading />
      ) : (
        <CameraFeed asset={asset} silent preset={preset?.meta.position}>
          <div className="w-64">
            <AssetBedSelect
              asset={asset}
              bed={bed}
              value={preset}
              onChange={setPreset}
            />
          </div>
        </CameraFeed>
      )}
    </div>
  );
};
