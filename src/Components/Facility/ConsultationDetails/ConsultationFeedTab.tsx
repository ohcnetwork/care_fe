import { lazy, useState } from "react";
import { ConsultationTabProps } from "./index";
import { AssetBedModel, AssetData } from "../../Assets/AssetTypes";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import CameraFeed from "../../CameraFeed/CameraFeed";
import Loading from "../../Common/Loading";
import AssetBedSelect from "../../CameraFeed/AssetBedSelect";
import { triggerGoal } from "../../../Integrations/Plausible";
import useAuthUser from "../../../Common/hooks/useAuthUser";

const PageTitle = lazy(() => import("../../Common/PageTitle"));

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  const authUser = useAuthUser();
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
        <CameraFeed
          asset={asset}
          silent
          preset={preset?.meta.position}
          onStreamError={() => {
            triggerGoal("Camera Feed Viewed", {
              consultationId: props.consultationId,
              userId: authUser.id,
              result: "error",
            });
          }}
          onStreamSuccess={() => {
            triggerGoal("Camera Feed Viewed", {
              consultationId: props.consultationId,
              userId: authUser.id,
              result: "success",
            });
          }}
        >
          <div className="w-64">
            <AssetBedSelect
              asset={asset}
              bed={bed}
              value={preset}
              onChange={(value) => {
                triggerGoal("Camera Preset Clicked", {
                  presetName: preset?.meta?.preset_name,
                  consultationId: props.consultationId,
                  userId: authUser.id,
                  result: "success",
                });
                setPreset(value);
              }}
            />
          </div>
        </CameraFeed>
      )}
    </div>
  );
};
