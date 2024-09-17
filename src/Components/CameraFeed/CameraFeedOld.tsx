import { useEffect, useState, useRef, useCallback } from "react";
import { useDispatch } from "react-redux";
import useKeyboardShortcut from "use-keyboard-shortcut";
import {
  listAssetBeds,
  partialUpdateAssetBed,
  deleteAssetBed,
} from "../../Redux/actions.js";
import { CameraPTZ, getCameraPTZ } from "../../Common/constants.js";
import { useFeedPTZ } from "./useFeedPTZ.js";
import * as Notification from "../../Utils/Notifications.js";
import { AxiosError } from "axios";
import { BedSelect } from "../Common/BedSelect.js";
import { BedModel } from "../Facility/models.js";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions.js";
import CareIcon, { IconName } from "../../CAREUI/icons/CareIcon.js";
import Page from "../Common/components/Page.js";
import ConfirmDialog from "../Common/ConfirmDialog.js";
import { FieldLabel } from "../Form/FormFields/FormField.js";
import useFullscreen from "../../Common/hooks/useFullscreen.js";
import TextFormField from "../Form/FormFields/TextFormField.js";
import VideoPlayer from "./videoPlayer.js";

export enum StreamStatus {
  Playing,
  Stop,
  Loading,
  Offline,
}

export const FeedCameraPTZHelpButton = (props: { cameraPTZ: CameraPTZ[] }) => {
  const { cameraPTZ } = props;
  return (
    <button
      key="option.action"
      className="tooltip rounded text-2xl text-secondary-600"
    >
      <CareIcon icon="l-question-circle" />

      <ul className="tooltip-text tooltip-left -top-60 right-10 p-2 text-sm">
        {cameraPTZ.map((option) => {
          return (
            <li key={option.action} className="flex items-center gap-3 py-2">
              <span className="w-16 font-semibold">{option.label}</span>
              <div className="flex gap-1">
                {option.shortcutKey.map((hotkey, index) => {
                  const isArrowKey = hotkey.includes("Arrow");
                  hotkey = hotkey.replace("Control", "Ctrl");

                  const keyElement = (
                    <div
                      key={index}
                      className="rounded-md border border-secondary-500 p-1.5 font-mono shadow-md"
                    >
                      {isArrowKey ? (
                        <CareIcon icon={option.icon as IconName} />
                      ) : (
                        hotkey
                      )}
                    </div>
                  );

                  // Skip wrapping with + for joining with next key
                  if (index === option.shortcutKey.length - 1)
                    return keyElement;

                  return (
                    <div key={index} className="flex items-center gap-1">
                      {keyElement}
                      <span className="p-1">+</span>
                    </div>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </button>
  );
};

const CameraFeedOld = (props: any) => {
  const middlewareHostname = props.middlewareHostname;
  const [presetsPage, setPresetsPage] = useState(0);
  const cameraAsset = props.asset;
  const [presets, setPresets] = useState<any>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline,
  );
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [bed, setBed] = useState<BedModel>({});
  const [presetName, setPresetName] = useState("");
  const [loading, setLoading] = useState<string | undefined>();
  const dispatch: any = useDispatch();
  const [page, setPage] = useState({
    count: 0,
    limit: 8,
    offset: 0,
  });
  const [toDelete, setToDelete] = useState<any>(null);
  const [toUpdate, setToUpdate] = useState<any>(null);
  const [_isFullscreen, setFullscreen] = useFullscreen();

  const { width } = useWindowDimensions();
  const extremeSmallScreenBreakpoint = 320;
  const isExtremeSmallScreen =
    width <= extremeSmallScreenBreakpoint ? true : false;
  const liveFeedPlayerRef = useRef<any>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");

  const refreshPresetsHash = props.refreshPresetsHash;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPreset, setCurrentPreset] = useState<any>();
  const {
    absoluteMove,
    getCameraStatus,
    getStreamToken,
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

  const getBedPresets = async (id: any) => {
    const bedAssets = await dispatch(
      listAssetBeds({
        asset: id,
        limit: page.limit,
        offset: page.offset,
      }),
    );
    setBedPresets(bedAssets?.data?.results);
    setPage({
      ...page,
      count: bedAssets?.data?.count,
    });
  };

  const deletePreset = async (id: any) => {
    const res = await dispatch(deleteAssetBed(id));
    if (res?.status === 204) {
      Notification.Success({ msg: "Preset deleted successfully" });
      getBedPresets(cameraAsset.id);
    } else {
      Notification.Error({
        msg: "Error while deleting Preset: " + (res?.data?.detail || ""),
      });
    }
    setToDelete(null);
  };

  const updatePreset = async (currentPreset: any) => {
    const data = {
      bed_id: bed.id,
      preset_name: presetName,
    };
    const response = await dispatch(
      partialUpdateAssetBed(
        {
          asset: currentPreset.asset_object.id,
          bed: bed.id,
          meta: {
            ...currentPreset.meta,
            ...data,
          },
        },
        currentPreset?.id,
      ),
    );
    if (response && response.status === 200) {
      Notification.Success({ msg: "Preset Updated" });
    } else {
      Notification.Error({ msg: "Something Went Wrong" });
    }
    getBedPresets(cameraAsset?.id);
    fetchCameraPresets();
    setToUpdate(null);
  };

  const gotoBedPreset = (preset: any) => {
    setLoading("Moving");
    absoluteMove(preset.meta.position, {
      onSuccess: () => setLoading(undefined),
    });
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
    setPresetName(toUpdate?.meta?.preset_name);
    setBed(toUpdate?.bed_object);
  }, [toUpdate]);

  useEffect(() => {
    getBedPresets(cameraAsset.id);
    if (bedPresets?.[0]?.position) {
      absoluteMove(bedPresets[0]?.position, {});
    }
  }, [page.offset, cameraAsset.id, refreshPresetsHash]);

  const startStreamFeed = useCallback(async () => {
    if (!liveFeedPlayerRef.current) return;

    await getStreamToken({
      onSuccess: (data) => {
        setStreamUrl(
          `wss://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0&token=${data.token}`,
        );
      },
      onError: () => {
        setStreamStatus(StreamStatus.Offline);
      },
    });
  }, [liveFeedPlayerRef.current]);

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
    let tId: any;
    if (streamStatus !== StreamStatus.Playing) {
      setStreamStatus(StreamStatus.Loading);
      tId = setTimeout(() => {
        startStreamFeed();
      }, 5000);
    }

    return () => {
      clearTimeout(tId);
    };
  }, [startStreamFeed, streamStatus]);

  const handlePagination = (cOffset: number) => {
    setPage({
      ...page,
      offset: cOffset,
    });
  };

  const cameraPTZActionCBs: { [key: string]: (option: any) => void } = {
    precision: () => {
      setPrecision((precision: number) =>
        precision === 16 ? 1 : precision * 2,
      );
    },
    reset: async () => {
      setStreamStatus(StreamStatus.Loading);
      setVideoStartTime(null);
      await startStreamFeed();
    },
    fullScreen: () => {
      if (!liveFeedPlayerRef.current) return;
      setFullscreen(true, liveFeedPlayerRef.current);
    },
    updatePreset: (option) => {
      getCameraStatus({
        onSuccess: async (data) => {
          if (currentPreset?.asset_object?.id && data?.position) {
            setLoading(option.loadingLabel);
            console.log("Updating Preset");
            const response = await dispatch(
              partialUpdateAssetBed(
                {
                  asset: currentPreset.asset_object.id,
                  bed: currentPreset.bed_object.id,
                  meta: {
                    ...currentPreset.meta,
                    position: data?.position,
                  },
                },
                currentPreset?.id,
              ),
            );
            if (response && response.status === 200) {
              Notification.Success({ msg: "Preset Updated" });
              getBedPresets(cameraAsset?.id);
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
    <Page title="Live Feed" hideBack>
      {toDelete && (
        <ConfirmDialog
          show
          title="Are you sure you want to delete this preset?"
          description={
            <span>
              <p>
                Preset: <strong>{toDelete.meta.preset_name}</strong>
              </p>
              <p>
                Bed: <strong>{toDelete.bed_object.name}</strong>
              </p>
            </span>
          }
          action="Delete"
          variant="danger"
          onClose={() => setToDelete(null)}
          onConfirm={() => deletePreset(toDelete.id)}
        />
      )}
      {toUpdate && (
        <ConfirmDialog
          show
          title="Update Preset"
          action="Update"
          variant="primary"
          onClose={() => setToUpdate(null)}
          onConfirm={() => updatePreset(toUpdate)}
        >
          <div className="mt-4">
            <TextFormField
              name="preset_name"
              label="Preset Name"
              value={presetName}
              onChange={({ value }) => setPresetName(value)}
            />
            <div className="flex flex-col">
              <FieldLabel required>Bed</FieldLabel>
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
          </div>
        </ConfirmDialog>
      )}
      <div className="mt-4 flex flex-col">
        <div className="relative mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            <div className="relative mb-4 aspect-video w-full rounded bg-primary-100 lg:mb-0">
              <VideoPlayer
                playerRef={liveFeedPlayerRef}
                streamUrl={streamUrl}
                className="z-10 h-full w-full"
                onPlay={() => {
                  setVideoStartTime(() => new Date());
                }}
                onWaiting={() => {
                  const delay = calculateVideoLiveDelay();
                  if (delay > 5) {
                    setStreamStatus(StreamStatus.Loading);
                  }
                }}
                onSuccess={() => setStreamStatus(StreamStatus.Playing)}
                onError={() => setStreamStatus(StreamStatus.Offline)}
              />

              {streamStatus === StreamStatus.Playing &&
                calculateVideoLiveDelay() > 3 && (
                  <div className="absolute left-8 top-12 z-10 flex items-center gap-2 rounded-3xl bg-red-400 px-3 py-1.5 text-xs font-semibold text-secondary-100">
                    <CareIcon icon="l-wifi-slash" className="h-4 w-4" />
                    <span>Slow Network Detected</span>
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
              {/* { streamStatus > 0 && */}
              <div className="absolute bottom-0 right-0 flex h-full w-full items-center justify-center p-4">
                {streamStatus === StreamStatus.Offline && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      STATUS: <span className="text-red-600">OFFLINE</span>
                    </p>
                    <p className="font-semibold text-black">
                      Feed is currently not live.
                    </p>
                    <p className="font-semibold text-black">
                      Click refresh button to try again.
                    </p>
                  </div>
                )}
                {streamStatus === StreamStatus.Stop && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      STATUS: <span className="text-red-600">STOPPED</span>
                    </p>
                    <p className="font-semibold text-black">Feed is Stooped.</p>
                    <p className="font-semibold text-black">
                      Click refresh button to start feed.
                    </p>
                  </div>
                )}
                {streamStatus === StreamStatus.Loading && (
                  <div className="text-center">
                    <p className="font-bold text-black">
                      STATUS: <span className="text-red-600"> LOADING</span>
                    </p>
                    <p className="font-semibold text-black">
                      Fetching latest feed.
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div
              className={`${
                isExtremeSmallScreen ? "flex flex-wrap" : "md:flex"
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
                className={`flex-1 p-4 text-center font-bold text-secondary-700 hover:text-secondary-800 ${
                  showDefaultPresets
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(true);
                }}
              >
                Default Presets
              </button>
              <button
                className={`flex-1 p-4 text-center font-bold text-secondary-700 hover:text-secondary-800 ${
                  !showDefaultPresets
                    ? "border-b-2 border-primary-500 text-primary-600"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(false);
                }}
              >
                Patient Presets
              </button>
            </nav>
            <div className="my-2 w-full space-y-4">
              <div
                className={`grid ${
                  isExtremeSmallScreen ? "sm:grid-cols-2" : "grid-cols-2"
                } my-auto gap-2`}
              >
                {showDefaultPresets ? (
                  <>
                    {viewOptions(presetsPage)?.map((option: any, i) => (
                      <button
                        key={i}
                        className="flex w-full flex-wrap gap-2 truncate whitespace-pre-wrap rounded-md border border-white bg-green-100 p-3 text-black hover:bg-green-500 hover:text-white"
                        onClick={() => {
                          setLoading(`Moving to Preset ${option.label}`);
                          gotoPreset(
                            { preset: option.value },
                            {
                              onSuccess: () => {
                                setLoading(undefined);
                                console.log("Preset Updated", option);
                              },
                            },
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    {bedPresets?.map((preset: any, index: number) => (
                      <div className="flex flex-col">
                        <button
                          key={preset.id}
                          className="flex h-full flex-col truncate whitespace-pre-wrap rounded-t-md border border-white bg-green-100 p-2 text-black hover:bg-green-500 hover:text-white"
                          onClick={() => {
                            setLoading("Moving");
                            gotoBedPreset(preset);
                            setCurrentPreset(preset);
                            getBedPresets(cameraAsset?.id);
                            fetchCameraPresets();
                          }}
                        >
                          <span className="justify-start text-xs font-semibold">
                            {preset.bed_object.name}
                          </span>
                          <span className="mx-auto">
                            {preset.meta.preset_name
                              ? preset.meta.preset_name
                              : `Unnamed Preset ${index + 1}`}
                          </span>
                        </button>
                        <div className="flex">
                          <button
                            onClick={() => setToUpdate(preset)}
                            className="flex w-1/2 items-center justify-center gap-2 bg-green-200 py-1 text-sm text-green-800 hover:bg-green-800 hover:text-green-200"
                          >
                            <CareIcon icon="l-pen" />
                          </button>
                          <button
                            onClick={() => setToDelete(preset)}
                            className="flex w-1/2 items-center justify-center gap-2 bg-red-200 py-1 text-sm text-red-800 hover:bg-red-800 hover:text-red-200"
                          >
                            <CareIcon icon="l-trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
              {/* Page Number Next and Prev buttons */}
              {showDefaultPresets ? (
                <div className="flex flex-row gap-1">
                  <button
                    className="flex-1 p-4 text-center font-bold text-secondary-700 hover:bg-secondary-300 hover:text-secondary-800"
                    disabled={presetsPage < 10}
                    onClick={() => {
                      setPresetsPage(presetsPage - 10);
                    }}
                  >
                    <CareIcon icon="l-arrow-left" className="text-2xl" />
                  </button>
                  <button
                    className="flex-1 p-4 text-center font-bold text-secondary-700 hover:bg-secondary-300 hover:text-secondary-800"
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
                    className="flex-1 p-4 text-center font-bold text-secondary-700 hover:bg-secondary-300 hover:text-secondary-800"
                    disabled={page.offset === 0}
                    onClick={() => {
                      handlePagination(page.offset - page.limit);
                    }}
                  >
                    <CareIcon icon="l-arrow-left" className="text-2xl" />
                  </button>
                  <button
                    className="flex-1 p-4 text-center font-bold text-secondary-700 hover:bg-secondary-300 hover:text-secondary-800"
                    disabled={page.offset + page.limit >= page.count}
                    onClick={() => {
                      handlePagination(page.offset + page.limit);
                    }}
                  >
                    <CareIcon icon="l-arrow-right" className="text-2xl" />
                  </button>
                </div>
              )}
              {props?.showRefreshButton && (
                <button
                  className="w-full rounded-md border border-white bg-green-100 px-3 py-2 font-semibold text-black hover:bg-green-500 hover:text-white"
                  onClick={() => {
                    getBedPresets(cameraAsset?.id);
                    fetchCameraPresets();
                  }}
                >
                  <CareIcon icon="l-redo" className="h-4 text-lg" /> Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default CameraFeedOld;
