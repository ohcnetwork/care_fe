import { AxiosError } from "axios";
import { LegacyRef, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import ReactPlayer from "react-player";
import { useDispatch } from "react-redux";
import useKeyboardShortcut from "use-keyboard-shortcut";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { getCameraPTZ } from "../../../Common/constants";
import { useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
import useFullscreen from "../../../Common/hooks/useFullscreen";
import {
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import useWindowDimensions from "../../../Common/hooks/useWindowDimensions";
import { deleteAssetBed, partialUpdateAssetBed } from "../../../Redux/actions";
import routes from "../../../Redux/api";
import * as Notification from "../../../Utils/Notifications.js";
import request from "../../../Utils/request/request";
import useQuery from "../../../Utils/request/useQuery";
import { isIOS } from "../../../Utils/utils";
import { BedSelect } from "../../Common/BedSelect";
import ConfirmDialog from "../../Common/ConfirmDialog";
import Page from "../../Common/components/Page";
import { FieldLabel } from "../../Form/FormFields/FormField";
import { BedModel, CameraPresetModel } from "../models";
import { FeedCameraPTZHelpButton } from "./Feed";

const LiveFeed = (props: any) => {
  const { t } = useTranslation();
  const middlewareHostname = props.middlewareHostname;
  const [presetsPage, setPresetsPage] = useState(0);
  const cameraAsset = props.asset;
  const [presets, setPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [bed, setBed] = useState<BedModel>({});
  const [loading, setLoading] = useState<string | undefined>();
  const dispatch: any = useDispatch();
  const [toDelete, setToDelete] = useState<CameraPresetModel>();
  const [toUpdate, setToUpdate] = useState<CameraPresetModel>();
  const [_isFullscreen, setFullscreen] = useFullscreen();

  const [offset, setOffset] = useState(0);
  const limit = 8;

  const { width } = useWindowDimensions();
  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen =
    width <= extremeSmallScreenBreakpoint ? true : false;
  const liveFeedPlayerRef = useRef<any>(null);

  const videoEl = liveFeedPlayerRef.current as HTMLVideoElement;

  const streamUrl = isIOS
    ? `https://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/hls/live/index.m3u8?uuid=${cameraAsset?.accessKey}&channel=0`
    : `wss://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`;

  const { startStream } = useMSEMediaPlayer({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    url: streamUrl,
    videoEl,
  });

  const refreshPresetsHash = props.refreshPresetsHash;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPreset, setCurrentPreset] = useState<CameraPresetModel>();
  const {
    absoluteMove,
    getCameraStatus,
    getPTZPayload,
    getPresets,
    gotoPreset,
    relativeMove,
  } = useFeedPTZ({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    dispatch,
  });

  const fetchCameraPresets = () =>
    getPresets({
      onSuccess: (resp) => {
        setPresets(resp);
      },
      onError: (resp) => {
        resp instanceof AxiosError &&
          Notification.Error({
            msg: "Camera is offline",
          });
      },
    });

  const calculateVideoLiveDelay = () => {
    const video = liveFeedPlayerRef.current as HTMLVideoElement;
    if (!video || !videoStartTime) return 0;

    const timeDifference =
      (new Date().getTime() - videoStartTime.getTime()) / 1000;

    return timeDifference - video.currentTime;
  };

  const { data: bedPresets, refetch: refetchBedPresets } = useQuery(
    routes.getCameraPresets,
    {
      query: {
        limit: limit,
        offset: offset,
      },
      pathParams: {
        external_id: cameraAsset?.id,
      },
    }
  );

  const deletePreset = async (id: string) => {
    const res = await dispatch(deleteAssetBed(id));
    if (res?.status === 204) {
      Notification.Success({ msg: "Preset deleted successfully" });
      refetchBedPresets();
    } else {
      Notification.Error({
        msg: "Error while deleting Preset: " + (res?.data?.detail || ""),
      });
    }
    setToDelete(undefined);
  };

  const updatePreset = async (currentPreset: CameraPresetModel) => {
    const resp = await request(routes.partialUpdateAssetBed, {
      body: {
        asset: currentPreset?.asset_bed_object.asset?.id,
        bed: bed.id,
      },
      pathParams: {
        external_id: currentPreset?.asset_bed_object.id || "",
      },
    });
    if (resp && resp.res?.status === 200) {
      Notification.Success({ msg: "Preset Updated" });
    } else {
      Notification.Error({ msg: "Something Went Wrong" });
    }
    refetchBedPresets();
    fetchCameraPresets();
    setToUpdate(undefined);
  };

  const gotoBedPreset = (preset: CameraPresetModel) => {
    setLoading("Moving");
    absoluteMove(
      {
        x: preset?.x || 0.0,
        y: preset?.y || 0.0,
        zoom: preset?.zoom || 1,
      },
      {
        onSuccess: () => setLoading(undefined),
      }
    );
  };

  useEffect(() => {
    if (cameraAsset?.hostname) {
      fetchCameraPresets();
      setTimeout(() => {
        startStreamFeed();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    refetchBedPresets();
    const position = {
      x: bedPresets?.results[0]?.x || 0.0,
      y: bedPresets?.results[0]?.y || 0.0,
      zoom: bedPresets?.results[0]?.zoom || 1,
    };
    if (position) {
      absoluteMove(position, {});
    }
  }, [offset, refreshPresetsHash]);

  const startStreamFeed = () => {
    startStream({
      onSuccess: () => setStreamStatus(StreamStatus.Playing),
      onError: () => setStreamStatus(StreamStatus.Offline),
    });
  };

  const viewOptions = (page: number) => {
    return presets
      ? Object.entries(presets)
          .map(([key, value]) => ({ label: key, value }))
          .slice(page, page + 10)
      : Array.from(Array(10), (_, i) => ({
          label: "Monitor " + (i + 1),
          value: i + 1,
        }));
  };
  useEffect(() => {
    let tId: NodeJS.Timeout;
    if (streamStatus !== StreamStatus.Playing) {
      setStreamStatus(StreamStatus.Loading);
      tId = setTimeout(() => {
        startStreamFeed();
      }, 5000);
    }

    return () => {
      clearTimeout(tId);
    };
  }, [startStream, streamStatus]);

  const cameraPTZActionCBs: { [key: string]: (option: any) => void } = {
    precision: () => {
      setPrecision((precision: number) =>
        precision === 16 ? 1 : precision * 2
      );
    },
    reset: () => {
      setStreamStatus(StreamStatus.Loading);
      setVideoStartTime(null);
      startStream({
        onSuccess: () => setStreamStatus(StreamStatus.Playing),
        onError: () => setStreamStatus(StreamStatus.Offline),
      });
    },
    fullScreen: () => {
      if (!liveFeedPlayerRef.current) return;
      setFullscreen(true, liveFeedPlayerRef.current);
    },
    updatePreset: (option) => {
      getCameraStatus({
        onSuccess: async (data) => {
          console.log({ currentPreset, data });
          if (currentPreset?.asset_bed_object?.asset?.id && data?.position) {
            setLoading(option.loadingLabel);
            console.log("Updating Preset");
            const response = await dispatch(
              partialUpdateAssetBed(
                {
                  asset: currentPreset.asset_bed_object?.asset?.id,
                  bed: currentPreset.asset_bed_object?.bed?.id,
                },
                currentPreset?.asset_bed_object?.id || ""
              )
            );
            if (response && response.status === 200) {
              Notification.Success({ msg: "Preset Updated" });
              refetchBedPresets();
              fetchCameraPresets();
            }
            setLoading(undefined);
          }
        },
      });
    },
    other: (option) => {
      setLoading(option.loadingLabel);
      relativeMove(getPTZPayload(option.action, precision), {
        onSuccess: () => setLoading(undefined),
      });
    },
  };

  const cameraPTZ = getCameraPTZ(precision).map((option) => {
    const cb =
      cameraPTZActionCBs[
        cameraPTZActionCBs[option.action] ? option.action : "other"
      ];
    return { ...option, callback: () => cb(option) };
  });

  // Voluntarily disabling eslint, since length of `cameraPTZ` is constant and
  // hence shall not cause issues. (https://news.ycombinator.com/item?id=24363703)
  for (const option of cameraPTZ) {
    if (!option.shortcutKey) continue;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKeyboardShortcut(option.shortcutKey, option.callback);
  }

  return (
    <Page title={t("live_feed")} hideBack>
      {toDelete && (
        <ConfirmDialog
          show
          title={t("delete_preset")}
          description={
            <span>
              <p>
                {t("preset")} <strong>{toDelete.preset_name}</strong>
              </p>
              <p>
                {t("bed")}:{" "}
                <strong>{toDelete.asset_bed_object?.bed?.name}</strong>
              </p>
            </span>
          }
          action="Delete"
          variant="danger"
          onClose={() => setToDelete(undefined)}
          onConfirm={() => deletePreset(toDelete?.id || "")}
        />
      )}
      {toUpdate && (
        <ConfirmDialog
          show
          title={t("update_preset")}
          description={"Preset: " + toUpdate.preset_name}
          action="Update"
          variant="primary"
          onClose={() => setToUpdate(undefined)}
          onConfirm={() => updatePreset(toUpdate)}
        >
          <div className="mt-4 flex flex-col">
            <FieldLabel required>{t("bed")}</FieldLabel>
            <BedSelect
              name="bed"
              setSelected={(selected) => setBed(selected as BedModel)}
              selected={bed}
              error=""
              multiple={false}
              location={cameraAsset.location_id}
              facility={cameraAsset.facility_id}
            />
          </div>
        </ConfirmDialog>
      )}
      <div className="mt-4 flex flex-col">
        <div className="relative mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative mb-4 aspect-video w-full rounded bg-primary-100 lg:mb-0">
              {isIOS ? (
                <div className="absolute inset-0">
                  <ReactPlayer
                    url={streamUrl}
                    ref={liveFeedPlayerRef.current as LegacyRef<ReactPlayer>}
                    controls={false}
                    playsinline
                    playing
                    muted
                    width="100%"
                    height="100%"
                    onPlay={() => {
                      setVideoStartTime(() => new Date());
                      setStreamStatus(StreamStatus.Playing);
                    }}
                    onWaiting={() => {
                      const delay = calculateVideoLiveDelay();
                      if (delay > 5) {
                        setStreamStatus(StreamStatus.Loading);
                      }
                    }}
                    onError={(e, _, hlsInstance) => {
                      if (e === "hlsError") {
                        const recovered = hlsInstance.recoverMediaError();
                        console.info(recovered);
                      }
                    }}
                  />
                </div>
              ) : (
                <video
                  id="mse-video"
                  autoPlay
                  muted
                  playsInline
                  className="z-10 h-full w-full"
                  ref={liveFeedPlayerRef}
                  onPlay={() => {
                    setVideoStartTime(() => new Date());
                  }}
                  onWaiting={() => {
                    const delay = calculateVideoLiveDelay();
                    if (delay > 5) {
                      setStreamStatus(StreamStatus.Loading);
                    }
                  }}
                ></video>
              )}

              {streamStatus === StreamStatus.Playing &&
                calculateVideoLiveDelay() > 3 && (
                  <div className="absolute left-8 top-12 z-10 flex items-center gap-2 rounded-3xl bg-red-400 px-3 py-1.5 text-xs font-semibold text-gray-100">
                    <CareIcon icon="l-wifi-slash" className="h-4 w-4" />
                    <span>{t("slow_network_detected")}</span>
                  </div>
                )}

              {loading && (
                <div className="absolute bottom-0 right-0 rounded-tl bg-white/75 p-4">
                  <div className="flex items-center gap-2">
                    <div className="an h-4 w-4 animate-spin rounded-full border-2 border-b-0 border-primary-500" />
                    <p className="text-base font-bold">{loading}</p>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 right-0 flex h-full w-full items-center justify-center p-4">
                {streamStatus === StreamStatus.Offline && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      {t("status")}:{" "}
                      <span className="text-red-600">{t("offline")}</span>
                    </p>
                    <p className="font-semibold text-black">
                      {t("feed_is_currently_not_live")}
                    </p>
                    <p className="font-semibold text-black">
                      {t("click_refresh_button_to_try_again")}
                    </p>
                  </div>
                )}
                {streamStatus === StreamStatus.Stop && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      {t("status")}:{" "}
                      <span className="text-red-600">STOPPED</span>
                    </p>
                    <p className="font-semibold text-black">
                      {t("feed_is_stopped")}
                    </p>
                    <p className="font-semibold text-black">
                      {t("click_refresh_button_to_start_feed")}
                    </p>
                  </div>
                )}
                {streamStatus === StreamStatus.Loading && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      {t("status")}:{" "}
                      <span className="text-red-600"> {t("loading")}</span>
                    </p>
                    <p className="font-semibold text-black">
                      {t("fetching_latest_feed")}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`${
                isExtremeSmallScreen ? " flex flex-wrap " : " md:flex "
              } mt-4 max-w-lg`}
            >
              {cameraPTZ.map((option) => {
                const shortcutKeyDescription =
                  option.shortcutKey &&
                  option.shortcutKey
                    .join(" + ")
                    .replace("Control", "Ctrl")
                    .replace("ArrowUp", "↑")
                    .replace("ArrowDown", "↓")
                    .replace("ArrowLeft", "←")
                    .replace("ArrowRight", "→");

                return (
                  <button
                    className="tooltip flex-1 border border-green-100 bg-green-100 p-2 hover:bg-green-200"
                    onClick={option.callback}
                  >
                    <span className="sr-only">{option.label}</span>
                    {option.icon ? (
                      <CareIcon icon={option.icon} />
                    ) : (
                      <span className="flex h-full w-8 items-center justify-center px-2 font-bold">
                        {option.value}x
                      </span>
                    )}
                    <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm font-semibold">{`${option.label}  (${shortcutKeyDescription})`}</span>
                  </button>
                );
              })}
              <div className="hidden pl-3 md:block">
                <FeedCameraPTZHelpButton cameraPTZ={cameraPTZ} />
              </div>
            </div>
          </div>

          <div className="mx-4 flex max-w-sm flex-col">
            <nav className="flex flex-wrap">
              <button
                className={`flex-1 p-4  text-center font-bold  text-gray-700 hover:text-gray-800  ${
                  showDefaultPresets
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(true);
                }}
              >
                {t("default_presets")}
              </button>
              <button
                className={`flex-1 p-4  text-center font-bold  text-gray-700 hover:text-gray-800  ${
                  !showDefaultPresets
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(false);
                }}
              >
                {t("patient_presets")}
              </button>
            </nav>
            <div className="my-2 w-full space-y-4">
              <div
                className={`grid ${
                  isExtremeSmallScreen ? " sm:grid-cols-2 " : " grid-cols-2 "
                } my-auto gap-2`}
              >
                {showDefaultPresets ? (
                  <>
                    {viewOptions(presetsPage)?.map((option: any, i) => (
                      <button
                        key={i}
                        className="max- flex w-full flex-wrap gap-2 truncate rounded-md border border-white bg-green-100 p-3  text-black hover:bg-green-500 hover:text-white"
                        onClick={() => {
                          setLoading(`Moving to Preset ${option.label}`);
                          gotoPreset(
                            { preset: option.value },
                            {
                              onSuccess: () => {
                                setLoading(undefined);
                                console.log("Preset Updated", option);
                              },
                            }
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {bedPresets?.results?.map(
                      (preset: CameraPresetModel, index: number) => (
                        <div className="flex flex-col">
                          <button
                            key={preset.id}
                            className="flex flex-col truncate rounded-t-md border border-white bg-green-100 p-2  text-black hover:bg-green-500 hover:text-white"
                            onClick={() => {
                              setLoading("Moving");
                              gotoBedPreset(preset);
                              setCurrentPreset(preset);
                              refetchBedPresets();
                              fetchCameraPresets();
                            }}
                          >
                            <span className="justify-start text-xs font-semibold">
                              {preset.asset_bed_object.bed?.name}
                            </span>
                            <span className="mx-auto">
                              {preset?.preset_name
                                ? preset.preset_name
                                : `Unnamed Preset ${index + 1}`}
                            </span>
                          </button>
                          <div className="flex">
                            <button
                              onClick={() => {
                                setToUpdate(preset);
                                setBed(preset.asset_bed_object.bed || {});
                              }}
                              className="flex w-1/2 items-center justify-center gap-2 bg-green-200 py-1 text-sm text-green-800 hover:bg-green-800 hover:text-green-200 "
                            >
                              <CareIcon icon="l-pen" />
                            </button>
                            <button
                              onClick={() => setToDelete(preset)}
                              className="flex w-1/2 items-center justify-center gap-2 bg-red-200 py-1 text-sm text-red-800 hover:bg-red-800 hover:text-red-200 "
                            >
                              <CareIcon icon="l-trash" />
                            </button>
                          </div>
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
              {/* Page Number Next and Prev buttons */}
              {showDefaultPresets ? (
                <div className="flex flex-row gap-1">
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={presetsPage < 10}
                    onClick={() => {
                      setPresetsPage(presetsPage - 10);
                    }}
                  >
                    <CareIcon icon="l-arrow-left" className="text-2xl" />
                  </button>
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={presetsPage >= presets?.length}
                    onClick={() => {
                      setPresetsPage(presetsPage + 10);
                    }}
                  >
                    <CareIcon icon="l-arrow-right" className="text-2xl" />
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-1">
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={offset === 0}
                    onClick={() => setOffset(offset - limit)}
                  >
                    <CareIcon icon="l-arrow-left" className="text-2xl" />
                  </button>
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={offset + limit >= (bedPresets?.count || 0)}
                    onClick={() => setOffset(offset + limit)}
                  >
                    <CareIcon icon="l-arrow-right" className="text-2xl" />
                  </button>
                </div>
              )}
              {props?.showRefreshButton && (
                <button
                  className="w-full rounded-md border border-white bg-green-100 px-3 py-2 font-semibold text-black hover:bg-green-500 hover:text-white"
                  onClick={() => {
                    refetchBedPresets();
                    fetchCameraPresets();
                  }}
                >
                  <CareIcon icon="l-redo" className="h-4 text-lg" />{" "}
                  {t("refresh")}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default LiveFeed;
