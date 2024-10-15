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
import useSlug from "../../../Common/hooks/useSlug";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import ButtonV2 from "../../Common/components/ButtonV2";
import useOperateCamera, {
  PTZPayload,
} from "../../CameraFeed/useOperateCamera";
import request from "../../../Utils/request/request";
import { classNames, isIOS } from "../../../Utils/utils";
import ConfirmDialog from "../../Common/ConfirmDialog";
import useBreakpoints from "../../../Common/hooks/useBreakpoints";
import { Warn } from "../../../Utils/Notifications";
import { useTranslation } from "react-i18next";
import { GetStatusResponse } from "../../CameraFeed/routes";
import StillWatching from "../../CameraFeed/StillWatching";
import PrivacyToggle, {
  TogglePrivacyButton,
} from "../../CameraFeed/PrivacyToggle";

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const facility = useSlug("facility");
  const bed = props.consultationData.current_bed?.bed_object;
  const feedStateSessionKey = `encounterFeedState[${props.consultationId}]`;
  const [isPrivacyEnabled, setIsPrivacyEnabled] = useState(
    props.consultationData.current_bed?.is_privacy_enabled ?? false,
  );

  const [asset, setAsset] = useState<AssetData>();
  const [preset, setPreset] = useState<AssetBedModel>();
  const [showPresetSaveConfirmation, setShowPresetSaveConfirmation] =
    useState(false);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const divRef = useRef<HTMLDivElement | null>(null);

  const suggestOptimalExperience = useBreakpoints({ default: true, sm: false });

  useEffect(() => {
    if (suggestOptimalExperience) {
      Warn({
        msg: t(
          isIOS
            ? "feed_optimal_experience_for_apple_phones"
            : "feed_optimal_experience_for_phones",
        ),
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { key, operate } = useOperateCamera(asset?.id ?? "", true);

  const { data, loading, refetch } = useQuery(routes.listAssetBeds, {
    query: { limit: 100, facility, bed: bed?.id },
    prefetch: !!bed,
    onResponse: ({ data }) => {
      if (!data) {
        return;
      }

      const presets = data.results.filter(
        (obj) =>
          obj.asset_object.meta?.asset_type === "CAMERA" &&
          obj.meta.type !== "boundary",
      );

      const lastStateJSON = sessionStorage.getItem(feedStateSessionKey);
      const preset =
        (() => {
          if (lastStateJSON) {
            const lastState = JSON.parse(lastStateJSON) as LastFeedState;
            if (lastState.type === "preset") {
              return presets.find((obj) => obj.id === lastState.value);
            }
            if (lastState.type === "position") {
              return {
                ...presets[0],
                id: "",
                meta: { ...presets[0].meta, position: lastState.value },
              };
            }
          }
        })() ?? presets[0];

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
    setShowPresetSaveConfirmation(false);
  };

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [!!bed, loading, !!asset, divRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (preset?.id) {
      sessionStorage.setItem(
        feedStateSessionKey,
        JSON.stringify({
          type: "preset",
          value: preset.id,
        } satisfies LastAccessedPreset),
      );
    }
  }, [feedStateSessionKey, preset]);

  if (loading) {
    return <Loading />;
  }

  if (!bed || !asset) {
    return <span>{t("no_bed_or_asset_linked")}</span>;
  }

  const cannotSaveToPreset = !hasMoved || !preset?.id;

  if (isPrivacyEnabled && props.consultationData.current_bed) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center gap-4 rounded-lg border-4 border-dashed border-secondary-400">
        <span className="text-center text-xl font-bold text-secondary-700">
          {t("camera_feed_disabled_due_to_privacy")}
        </span>
        <TogglePrivacyButton
          value={isPrivacyEnabled}
          consultationBedId={props.consultationData.current_bed.id}
          onChange={setIsPrivacyEnabled}
        />
      </div>
    );
  }

  return (
    <StillWatching>
      <ConfirmDialog
        title={t("update_preset")}
        description={t("update_preset_confirmation")}
        action="Confirm"
        show={showPresetSaveConfirmation}
        onClose={() => setShowPresetSaveConfirmation(false)}
        onConfirm={handleUpdatePreset}
      />

      <div
        ref={divRef}
        className={classNames(
          "-mx-3 lg:-mb-2",
          isIOS && "mt-8", // For some reason iOS based browser alone seems to be needing this.
        )}
      >
        <CameraFeed
          key={key}
          asset={asset}
          preset={preset?.meta.position}
          onMove={() => {
            setHasMoved(true);
            setTimeout(async () => {
              const { data } = await operate({ type: "get_status" });
              if (data) {
                sessionStorage.setItem(
                  feedStateSessionKey,
                  JSON.stringify({
                    type: "position",
                    value: (data as GetStatusResponse).result.position,
                  } satisfies LastAccessedPosition),
                );
              }
            }, 3000);
          }}
          operate={operate}
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
          <div className="flex items-center">
            {props.consultationData.current_bed && (
              <PrivacyToggle
                initalValue={isPrivacyEnabled}
                onChange={setIsPrivacyEnabled}
                consultationBedId={props.consultationData.current_bed.id}
              />
            )}
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
                    // Voluntarily copying to trigger change of reference of the position attribute, so that the useEffect of CameraFeed that handles the moves gets triggered.
                    setPreset({
                      ...value,
                      meta: {
                        ...value.meta,
                        position: { ...value.meta.position },
                      },
                    });
                  }}
                />
                {isUpdatingPreset ? (
                  <CareIcon
                    icon="l-spinner"
                    className="animate-spin text-base text-zinc-300 md:mx-2"
                  />
                ) : (
                  <ButtonV2
                    size="small"
                    variant="secondary"
                    disabled={cannotSaveToPreset}
                    border
                    ghost={cannotSaveToPreset}
                    shadow={!cannotSaveToPreset}
                    tooltip={
                      !cannotSaveToPreset
                        ? t("save_current_position_to_preset")
                        : t("change_camera_position_and_update_preset")
                    }
                    tooltipClassName="translate-x-3 translate-y-8 text-xs"
                    className="ml-1"
                    onClick={() => setShowPresetSaveConfirmation(true)}
                  >
                    <CareIcon icon="l-save" className="text-lg" />
                  </ButtonV2>
                )}
              </>
            ) : (
              <span>{t("loading_preset") + "..."}</span>
            )}
          </div>
        </CameraFeed>
      </div>
    </StillWatching>
  );
};

type LastAccessedPreset = {
  type: "preset";
  value: string;
};

type LastAccessedPosition = {
  type: "position";
  value: PTZPayload;
};

type LastFeedState = LastAccessedPosition | LastAccessedPreset;
