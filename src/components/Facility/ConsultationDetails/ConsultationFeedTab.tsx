import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import CameraFeed from "@/components/CameraFeed/CameraFeed";
import CameraPresetSelect from "@/components/CameraFeed/CameraPresetSelect";
import StillWatching from "@/components/CameraFeed/StillWatching";
import {
  CameraPreset,
  FeedRoutes,
  GetStatusResponse,
} from "@/components/CameraFeed/routes";
import useOperateCamera, {
  PTZPayload,
} from "@/components/CameraFeed/useOperateCamera";
import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import Loading from "@/components/Common/Loading";
import { ConsultationTabProps } from "@/components/Facility/ConsultationDetails/index";

import useAuthUser from "@/hooks/useAuthUser";
import useBreakpoints from "@/hooks/useBreakpoints";

import { triggerGoal } from "@/Integrations/Plausible";
import { Warn } from "@/Utils/Notifications";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { classNames, isIOS } from "@/Utils/utils";

export const ConsultationFeedTab = (props: ConsultationTabProps) => {
  const { t } = useTranslation();
  const authUser = useAuthUser();
  const bed = props.consultationData.current_bed?.bed_object;
  const feedStateSessionKey = `encounterFeedState[${props.consultationId}]`;
  const [preset, setPreset] = useState<CameraPreset>();
  const [selectedPreset, setSelectedPreset] = useState<CameraPreset>();
  const [showPresetSaveConfirmation, setShowPresetSaveConfirmation] =
    useState(false);
  const [isUpdatingPreset, setIsUpdatingPreset] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const divRef = useRef<any>();

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
  }, []);

  const asset = preset?.asset_bed.asset_object;

  const { key, operate } = useOperateCamera(asset?.id ?? "");

  const presetsQuery = useTanStackQueryInstead(FeedRoutes.listBedPresets, {
    pathParams: { bed_id: bed?.id ?? "" },
    query: { limit: 100 },
    prefetch: !!bed,
    onResponse: ({ data }) => {
      if (!data) {
        return;
      }

      const presets = data.results;
      const lastStateJSON = sessionStorage.getItem(feedStateSessionKey);

      const preset =
        (() => {
          if (lastStateJSON) {
            const lastState = JSON.parse(lastStateJSON) as LastFeedState;
            if (lastState.type === "preset") {
              return presets.find((obj) => obj.id === lastState.value);
            }
            if (lastState.type === "position") {
              return;
            }
          }
        })() ?? presets[0];

      if (preset) {
        setPreset(preset);
        setSelectedPreset(preset);
      }
    },
  });

  const presets = presetsQuery.data?.results;

  const handleUpdatePreset = async () => {
    if (!preset) return;

    setIsUpdatingPreset(true);

    const { data } = await operate({ type: "get_status" });
    const { position } = (data as { result: { position: PTZPayload } }).result;
    const { data: updated } = await request(FeedRoutes.updatePreset, {
      pathParams: {
        assetbed_id: preset.asset_bed.id,
        id: preset.id,
      },
      body: {
        position,
      },
    });

    await presetsQuery.refetch();

    setPreset(updated);
    setSelectedPreset(updated);
    setHasMoved(false);
    setIsUpdatingPreset(false);
    setShowPresetSaveConfirmation(false);
  };

  useEffect(() => {
    if (divRef.current) {
      divRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [!!bed, presetsQuery.loading, !!asset, divRef.current]);

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

  if (presetsQuery.loading) {
    return <Loading />;
  }

  if (!bed || !asset) {
    return <span>{t("no_bed_asset_linked_allocated")}</span>;
  }

  const cannotSaveToPreset = !hasMoved || !preset?.id;

  return (
    <StillWatching>
      <ConfirmDialog
        title={t("update_preset")}
        description={`Are you sure you want to update ${preset?.name} to the current location?`}
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
          preset={selectedPreset?.position}
          onMove={() => {
            setSelectedPreset(undefined);
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
            {presets ? (
              <>
                <CameraPresetSelect
                  options={presets}
                  label={(obj) => obj.name}
                  value={selectedPreset}
                  onChange={(value) => {
                    triggerGoal("Camera Preset Clicked", {
                      presetName: selectedPreset?.name,
                      consultationId: props.consultationId,
                      userId: authUser.id,
                      result: "success",
                    });
                    setHasMoved(false);
                    setPreset(value);
                    setSelectedPreset(value);
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
                        ? "Save current position to selected preset"
                        : "Change camera position to update preset"
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
              <span>loading presets...</span>
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
