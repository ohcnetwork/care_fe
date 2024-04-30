import { useEffect, useRef, useState } from "react";
import { ConsultationTabProps } from "./index";
import { AssetBedModel, AssetData } from "../../Assets/AssetTypes";
import routes from "../../../Redux/api";
import useQuery from "../../../Utils/request/useQuery";
import CameraFeed from "../../CameraFeed/CameraFeed";
import Loading from "../../Common/Loading";
import AssetBedSelect from "../../CameraFeed/AssetBedSelect";
import { triggerGoal } from "../../../Integrations/Plausible";
import useAuthUser from "../../../Common/hooks/useAuthUser";
import PageTitle from "../../Common/PageTitle";
import useSlug from "../../../Common/hooks/useSlug";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2 from "../../Common/components/ButtonV2";
import useOperateCamera, {
  PTZPayload,
} from "../../CameraFeed/useOperateCamera";
import request from "../../../Utils/request/request";
import { classNames } from "../../../Utils/utils";

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  const authUser = useAuthUser();
  const facility = useSlug("facility");
  const bed = props.consultationData.current_bed?.bed_object;

  const [asset, setAsset] = useState<AssetData>();
  const [preset, setPreset] = useState<AssetBedModel>();
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const divRef = useRef<any>();

  const operate = useOperateCamera(asset?.id ?? "", true);

  const { data, loading, refetch } = useQuery(routes.listAssetBeds, {
    query: { limit: 100, facility, bed: bed?.id, asset: asset?.id },
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

  const presets = data?.results;

  const handleUpdatePreset = async () => {
    if (!preset) return;

    setIsUpdatingPreset(true);

    const { data } = await operate({ type: "get_status" });
    const { position } = (data as { result: { position: PTZPayload } }).result;

    const { data: updated } = await request(routes.partialUpdateAssetBed, {
      pathParams: { external_id: preset.id },
      body: {
        asset: preset.asset_object.id,
        bed: preset.bed_object.id,
        meta: { ...preset.meta, position },
      },
    });

    await refetch();

    setPreset(updated);
    setHasMoved(false);
    setIsUpdatingPreset(false);
  };

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [!!bed, loading, !!asset, divRef.current]);

  if (loading) {
    return <Loading />;
  }

  if (!bed || !asset) {
    return <span>No bed/asset linked allocated</span>;
  }

  return (
    <div>
      <PageTitle
        title="Camera Feed"
        breadcrumbs={false}
        hideBack={true}
        focusOnLoad={false}
      />
      <div ref={divRef}>
        <CameraFeed
          asset={asset}
          preset={preset?.meta.position}
          onMove={() => setHasMoved(true)}
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
          <div className="flex w-36 items-center justify-end md:w-64">
            {presets ? (
              <>
                <AssetBedSelect
                  options={presets}
                  label={(obj) => obj.meta.preset_name}
                  value={preset}
                  onChange={(value) => {
                    triggerGoal("Camera Preset Clicked", {
                      presetName: preset?.meta?.preset_name,
                      consultationId: props.consultationId,
                      userId: authUser.id,
                      result: "success",
                    });
                    setHasMoved(false);
                    setPreset(value);
                  }}
                />
                {isUpdatingPreset ? (
                  <CareIcon
                    icon="l-spinner"
                    className="animate-spin text-base text-zinc-500 md:mx-2"
                  />
                ) : (
                  <ButtonV2
                    size="small"
                    variant="secondary"
                    disabled={!hasMoved}
                    className="disabled:bg-transparent disabled:text-zinc-700"
                    ghost
                    tooltip={
                      hasMoved
                        ? "Save current position to preset"
                        : "Change camera position to update preset"
                    }
                    tooltipClassName={classNames(
                      "translate-y-8 text-xs",
                      hasMoved ? "-translate-x-20" : "-translate-x-28",
                    )}
                    onClick={handleUpdatePreset}
                  >
                    <CareIcon icon="l-save" className="text-base" />
                  </ButtonV2>
                )}
              </>
            ) : (
              <span>loading presets...</span>
            )}
          </div>
        </CameraFeed>
      </div>
    </div>
  );
};
