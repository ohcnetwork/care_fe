import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import useKeyboardShortcut from "use-keyboard-shortcut";
import {
  listAssetBeds,
  partialUpdateAssetBed,
  deleteAssetBed,
} from "../../../Redux/actions";
import { getCameraPTZ } from "../../../Common/constants";
import {
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import { useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
import * as Notification from "../../../Utils/Notifications.js";
import { FeedCameraPTZHelpButton } from "./Feed";
import { AxiosError } from "axios";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../models";
import useWindowDimensions from "../../../Common/hooks/useWindowDimensions";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import Page from "../../Common/components/Page";
import ConfirmDialog from "../../Common/ConfirmDialog";
import { FieldLabel } from "../../Form/FormFields/FormField";
import useFullscreen from "../../../Common/hooks/useFullscreen";

const LiveFeed = (props: any) => {
  const middlewareHostname =
    props.middlewareHostname || "dev_middleware.coronasafe.live";
  const [presetsPage, setPresetsPage] = useState(0);
  const cameraAsset = props.asset;
  const [presets, setPresets] = useState<any>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );
  const [bed, setBed] = useState<BedModel>({});
  const [preset, setNewPreset] = useState<string>("");
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

  const videoEl = liveFeedPlayerRef.current as HTMLVideoElement;

  const url = `wss://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`;

  const { startStream } = useMSEMediaPlayer({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    url,
    videoEl,
  });

  const refreshPresetsHash = props.refreshPresetsHash;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [currentPreset, setCurrentPreset] = useState<any>();
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

  const getBedPresets = async (id: any) => {
    const bedAssets = await dispatch(
      listAssetBeds({
        asset: id,
        limit: page.limit,
        offset: page.offset,
      })
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
      preset_name: preset,
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
        currentPreset?.id
      )
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
    }
  }, []);

  useEffect(() => {
    setNewPreset(toUpdate?.meta?.preset_name);
    setBed(toUpdate?.bed_object);
  }, [toUpdate]);

  useEffect(() => {
    getBedPresets(cameraAsset.id);
    if (bedPresets?.[0]?.position) {
      absoluteMove(bedPresets[0]?.position, {});
    }
  }, [page.offset, cameraAsset.id, refreshPresetsHash]);

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
        startStream({
          onSuccess: () => setStreamStatus(StreamStatus.Playing),
          onError: () => setStreamStatus(StreamStatus.Offline),
        });
      }, 500);
    }

    return () => {
      clearTimeout(tId);
    };
  }, [startStream, streamStatus]);

  const handlePagination = (cOffset: number) => {
    setPage({
      ...page,
      offset: cOffset,
    });
  };

  const cameraPTZActionCBs: { [key: string]: (option: any) => void } = {
    precision: () => {
      setPrecision((precision: number) =>
        precision === 16 ? 1 : precision * 2
      );
    },
    reset: () => {
      setStreamStatus(StreamStatus.Loading);
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
                currentPreset?.id
              )
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
          description={"Preset: " + toUpdate.meta.preset_name}
          action="Update"
          variant="primary"
          onClose={() => setToUpdate(null)}
          onConfirm={() => updatePreset(toUpdate)}
        >
          <div className="mt-4 flex flex-col">
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
        </ConfirmDialog>
      )}
      <div className="mt-4 flex flex-col">
        <div className="relative mt-4 flex flex-col gap-4 lg:flex-row">
          <div className="flex-1">
            {/* ADD VIDEO PLAYER HERE */}
            <div className="feed-aspect-ratio relative mb-4 w-full rounded bg-primary-100 lg:mb-0">
              <video
                id="mse-video"
                autoPlay
                muted
                playsInline
                className="z-10 h-full w-full"
                ref={liveFeedPlayerRef}
              ></video>

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
                      <CareIcon className={`care-${option.icon}`} />
                    ) : (
                      <span className="flex h-full w-8 items-center justify-center px-2 font-bold">
                        {option.value}x
                      </span>
                    )}
                    <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm font-semibold">{`${option.label}  (${shortcutKeyDescription})`}</span>
                  </button>
                );
              })}
              <div className="hideonmobilescreen pl-3">
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
                Default Presets
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
                Patient Presets
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
                    {bedPresets?.map((preset: any, index: number) => (
                      <div className="flex flex-col">
                        <button
                          key={preset.id}
                          className="flex flex-col truncate rounded-t-md border border-white bg-green-100 p-2  text-black hover:bg-green-500 hover:text-white"
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
                            className="flex w-1/2 items-center justify-center gap-2 bg-green-200 py-1 text-sm text-green-800 hover:bg-green-800 hover:text-green-200 "
                          >
                            <i className="fa-solid fa-pencil"></i>
                          </button>
                          <button
                            onClick={() => setToDelete(preset)}
                            className="flex w-1/2 items-center justify-center gap-2 bg-red-200 py-1 text-sm text-red-800 hover:bg-red-800 hover:text-red-200 "
                          >
                            <i className="fa-solid fa-trash-can"></i>
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
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={presetsPage < 10}
                    onClick={() => {
                      setPresetsPage(presetsPage - 10);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={presetsPage >= presets?.length}
                    onClick={() => {
                      setPresetsPage(presetsPage + 10);
                    }}
                  >
                    <i className="fas fa-arrow-right"></i>
                  </button>
                </div>
              ) : (
                <div className="flex flex-row gap-1">
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={page.offset === 0}
                    onClick={() => {
                      handlePagination(page.offset - page.limit);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="flex-1 p-4  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                    disabled={page.offset + page.limit >= page.count}
                    onClick={() => {
                      handlePagination(page.offset + page.limit);
                    }}
                  >
                    <i className="fas fa-arrow-right"></i>
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
                  <CareIcon className="care-l-redo h-4 text-lg" /> Refresh
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
