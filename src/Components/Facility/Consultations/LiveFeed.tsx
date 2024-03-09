import { useEffect, useState, useRef, LegacyRef } from "react";
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
import { UpdateCameraBoundaryConfigure } from "../../Assets/configure/CameraBoundaryConfigure";
import { BoundaryRange } from "../../../Common/constants";
import CameraConfigure from "../../Assets/configure/CameraConfigure";
import CameraBoundaryConfigure from "../../Assets/configure/CameraBoundaryConfigure";
import { direction } from "../../../Common/constants";
import ReactPlayer from "react-player";
import { isIOS } from "../../../Utils/utils";

const LiveFeed = (props: any) => {
  const middlewareHostname = props.middlewareHostname;
  const [presetsPage, setPresetsPage] = useState(0);
  const cameraAsset = props.asset;
  const [presets, setPresets] = useState<any>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );
  const [bedTransfer, setBedTransfer] = useState<BedModel>({});
  const [newPresetName, setNewPresetName] = useState<string>("");
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState<string | undefined>();
  const dispatch: any = useDispatch();
  const [page, setPage] = useState({
    count: 0,
    limit: 8,
    offset: 0,
  });
  const [toDelete, setToDelete] = useState<any>(null);
  const [toUpdate, setToUpdate] = useState<any>(null);
  const [isPreview, setIsPreview] = useState<boolean>(false);
  const [direction, setDirection] = useState<direction>(null);
  const [_isFullscreen, setFullscreen] = useFullscreen();
  const [toAddPreset, setToAddPreset] = useState<boolean>(false);
  const asset: any = props.asset;
  const addPreset: () => void = props.addPreset;
  const bed: BedModel = props.bed;
  const setBed: (bed: BedModel) => void = props.setBed;
  const loadingAddPreset: boolean = props.loadingAddPreset;
  const newPreset: string = props.newPreset;
  const setNewPreset: (preset: string) => void = props.setNewPreset;

  // boundary preset configuration.
  const boundaryPreset: any = props?.boundaryPreset;
  const addBoundaryPreset: () => void = props?.addBoundaryPreset;
  const deleteBoundaryPreset: () => void = props?.deleteBoundaryPreset;
  const setBoundaryPreset: (preset: any) => void = props?.setBoundaryPreset;
  const fetchBoundaryBedPreset: () => void = props?.fetchBoundaryBedPreset;
  const updateBoundaryPreset: () => void = props?.updateBoundaryPreset;
  const updateBoundaryNotif: string = props.updateBoundaryNotif;
  const setUpdateBoundaryNotif: (notif: string) => void =
    props.setUpdateBoundaryNotif;
  const [updateBoundaryInfo, setUpdateBoundaryInfo] = useState<
    Record<string, boolean>
  >({
    left: false,
    right: false,
    up: false,
    down: false,
  });
  const setToUpdateBoundary: (toUpdate: boolean) => void =
    props.setToUpdateBoundary;
  const loadingAddBoundaryPreset: boolean = props.loadingAddBoundaryPreset;
  const toUpdateBoundary: boolean = props.toUpdateBoundary;

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

  const calculateVideoLiveDelay = () => {
    const video = liveFeedPlayerRef.current as HTMLVideoElement;
    if (!video || !videoStartTime) return 0;

    const timeDifference =
      (new Date().getTime() - videoStartTime.getTime()) / 1000;

    return timeDifference - video.currentTime;
  };

  const getBedPresets = async (id: any) => {
    const bedAssets = bed.id
      ? await dispatch(
          listAssetBeds({
            asset: id,
            bed: bed.id,
            limit: page.limit,
            offset: page.offset,
          })
        )
      : await dispatch(
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
    if (bed?.id) {
      fetchBoundaryBedPreset();
    }
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
      bed_id: bedTransfer.id,
      preset_name: newPresetName,
    };
    const response = await dispatch(
      partialUpdateAssetBed(
        {
          asset: currentPreset.asset_object.id,
          bed: bedTransfer.id,
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

  //conditionally disable feed buttons when modifying the boundary
  const disableFeedButton: (action: string) => boolean = (action) => {
    if (
      (direction == "left" || direction == "right") &&
      (action == "left" || action == "right")
    ) {
      return false;
    } else if (
      (direction == "up" || direction == "down") &&
      (action == "up" || action == "down")
    ) {
      return false;
    } else if (
      action == "precision" ||
      action == "zoomIn" ||
      action == "zoomOut" ||
      action == "fullScreen"
    ) {
      return false;
    }
    return true;
  };

  //update a directional boundary when modifying the boundary
  const changeDirectionalBoundary = (option: any) => {
    const { max_x, max_y, min_x, min_y }: BoundaryRange =
      boundaryPreset.meta.range;
    const range: BoundaryRange = {
      max_x: max_x,
      max_y: max_y,
      min_x: min_x,
      min_y: min_y,
    };
    const delta = 0.1 / Math.max(1, precision);
    if (direction == "left") {
      range.min_x =
        option.action == "left" ? range.min_x - delta : range.min_x + delta;
    } else if (direction == "right") {
      range.max_x =
        option.action == "right" ? range.max_x + delta : range.max_x - delta;
    } else if (direction == "up") {
      range.max_y =
        option.action == "up" ? range.max_y + delta : range.max_y - delta;
    } else if (direction == "down") {
      range.min_y =
        option.action == "down" ? range.min_y - delta : range.min_y + delta;
    }

    setBoundaryPreset({
      ...boundaryPreset,
      meta: {
        ...boundaryPreset.meta,
        range: range,
      },
    });
    updateBoundaryPreset();

    setUpdateBoundaryInfo({
      ...updateBoundaryInfo,
      [direction as string]: true,
    });
  };

  const runFunctionWithDelay = (func: () => any, delay: number) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(func());
      }, delay);
    });
  };

  //preivew all the edges of the boundary at a delay of 3 seconds
  const previewBoundary = async () => {
    if (boundaryPreset?.meta?.range) {
      setIsPreview(true);
      setLoading("Previewing Boundary");
      const { max_x, max_y, min_x, min_y }: BoundaryRange =
        boundaryPreset.meta.range;
      const edges: any[] = [
        { x: max_x, y: (max_y + min_y) / 2, zoom: 0.2 },
        { x: (max_x + min_x) / 2, y: max_y, zoom: 0.2 },
        { x: min_x, y: (max_y + min_y) / 2, zoom: 0.2 },
        { x: (max_x + min_x) / 2, y: min_y, zoom: 0.2 },
      ];
      for (const edge of edges) {
        await runFunctionWithDelay(() => absoluteMove(edge, {}), 3000);
      }
      setIsPreview(false);
      setLoading(undefined);
    }
  };

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

      if (toUpdateBoundary && boundaryPreset?.meta?.range) {
        changeDirectionalBoundary(option);
      }
      relativeMove(getPTZPayload(option.action, precision), {
        onSuccess: () => setLoading(undefined),
        onError: () => setLoading(undefined),
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

  useEffect(() => {
    if (cameraAsset?.hostname) {
      fetchCameraPresets();
    }
  }, []);

  useEffect(() => {
    setNewPresetName(toUpdate?.meta?.preset_name);
    setBedTransfer(toUpdate?.bed_object);
  }, [toUpdate]);

  useEffect(() => {
    getBedPresets(cameraAsset.id);
    setToUpdateBoundary(false);
    setDirection(null);
  }, [page.offset, cameraAsset.id, refreshPresetsHash, bed]);

  //hook move to directional boundary when modifying the boundary
  useEffect(() => {
    const gotoDirectionalBoundary = (): void => {
      if (boundaryPreset?.meta?.range && direction) {
        const { max_x, max_y, min_x, min_y }: BoundaryRange =
          boundaryPreset.meta.range;
        const position = {
          x: 0,
          y: 0,
          zoom: 0.2,
        };
        if (direction == "left") {
          position.x = min_x;
          position.y = (min_y + max_y) / 2;
          setLoading("Moving to Left Boundary");
        }
        if (direction == "right") {
          position.x = max_x;
          position.y = (min_y + max_y) / 2;
          setLoading("Moving to Right Boundary");
        }
        if (direction == "up") {
          position.x = (min_x + max_x) / 2;
          position.y = max_y;
          setLoading("Moving to Top Boundary");
        }
        if (direction == "down") {
          position.x = (min_x + max_x) / 2;
          position.y = min_y;
          setLoading("Moving to Bottom Boundary");
        }
        absoluteMove(position, {
          onSuccess: () => setLoading(undefined),
          onError: () => {
            Notification.Error({ msg: "Something went wrong" });
            setLoading(undefined);
          },
        });
      } else {
        Notification.Error({ msg: "Something went wrong" });
      }
    };

    if (boundaryPreset?.meta?.range && direction) {
      try {
        gotoDirectionalBoundary();
      } catch (e) {
        Notification.Error({ msg: "Something Went Wrong" });
      }
    }
  }, [direction]);

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
      }, 1000);
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
              setSelected={(selected) => setBedTransfer(selected as BedModel)}
              selected={bedTransfer}
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
                    <CareIcon className="care-l-wifi-slash h-4 w-4" />
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
                    disabled={
                      toUpdateBoundary && disableFeedButton(option.action)
                    }
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
              <div className="hidden pl-3 md:block">
                <FeedCameraPTZHelpButton cameraPTZ={cameraPTZ} />
              </div>
            </div>
          </div>
          <div className="mx-4 flex max-w-sm flex-col">
            <div className={`${isPreview ? "disabled-select-form" : null}`}>
              <label id="bed-select">Bed</label>
              <BedSelect
                name="bed"
                className="overflow-y-scoll z-50 mt-2"
                setSelected={(selected) => setBed(selected as BedModel)}
                selected={bed}
                error=""
                multiple={false}
                location={asset?.location_id}
                facility={asset?.facility_id}
              />
            </div>
            {toAddPreset ? (
              <CameraConfigure
                setToAddPreset={setToAddPreset}
                addPreset={addPreset}
                isLoading={loadingAddPreset}
                newPreset={newPreset}
                setNewPreset={setNewPreset}
              />
            ) : (
              <>
                {toUpdateBoundary ? (
                  <UpdateCameraBoundaryConfigure
                    direction={direction}
                    setDirection={setDirection}
                    setToUpdateBoundary={setToUpdateBoundary}
                    updateBoundaryInfo={updateBoundaryInfo}
                    setUpdateBoundaryInfo={setUpdateBoundaryInfo}
                    updateBoundaryNotif={updateBoundaryNotif}
                    setUpdateBoundaryNotif={setUpdateBoundaryNotif}
                  />
                ) : (
                  <>
                    <CameraBoundaryConfigure
                      addBoundaryPreset={addBoundaryPreset}
                      deleteBoundaryPreset={deleteBoundaryPreset}
                      boundaryPreset={boundaryPreset}
                      bed={bed}
                      toUpdateBoundary={toUpdateBoundary}
                      setToUpdateBoundary={setToUpdateBoundary}
                      loadingAddBoundaryPreset={loadingAddBoundaryPreset}
                      toAddPreset={toAddPreset}
                      setDirection={setDirection}
                      previewBoundary={previewBoundary}
                      isPreview={isPreview}
                    />

                    <nav className="flex flex-wrap">
                      <button
                        className={`flex-1 p-4 text-center text-sm font-semibold  text-gray-700 hover:text-gray-800  ${
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
                        className={`flex-1 p-4  text-center text-sm font-semibold  text-gray-700 hover:text-gray-800  ${
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
                          isExtremeSmallScreen
                            ? " sm:grid-cols-2 "
                            : " grid-cols-2 "
                        } my-auto gap-2`}
                      >
                        {showDefaultPresets ? (
                          <>
                            {viewOptions(presetsPage)?.map((option: any, i) => (
                              <button
                                key={i}
                                className="max- flex w-full flex-wrap gap-2 truncate rounded-md border border-white bg-green-100 p-3  text-black hover:bg-green-500 hover:text-white"
                                onClick={() => {
                                  setLoading(
                                    `Moving to Preset ${option.label}`
                                  );
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
                            {bedPresets?.map(
                              (preset: any, index: number) =>
                                preset?.meta?.type != "boundary" && (
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
                            className="flex-1 p-2  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                            disabled={presetsPage < 10}
                            onClick={() => {
                              setPresetsPage(presetsPage - 10);
                            }}
                          >
                            <CareIcon
                              icon="l-arrow-left"
                              className="text-2xl"
                            />
                          </button>
                          <button
                            className="flex-1 p-2  text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                            disabled={presetsPage >= presets?.length}
                            onClick={() => {
                              setPresetsPage(presetsPage + 10);
                            }}
                          >
                            <CareIcon
                              icon="l-arrow-right"
                              className="text-2xl"
                            />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-row gap-1">
                          <button
                            className="flex-1 p-2 text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                            disabled={page.offset === 0}
                            onClick={() => {
                              handlePagination(page.offset - page.limit);
                            }}
                          >
                            <CareIcon
                              icon="l-arrow-left"
                              className="text-2xl"
                            />
                          </button>
                          <button
                            className="flex-1 p-2 text-center font-bold  text-gray-700 hover:bg-gray-300 hover:text-gray-800"
                            disabled={page.offset + page.limit >= page.count}
                            onClick={() => {
                              handlePagination(page.offset + page.limit);
                            }}
                          >
                            <CareIcon
                              icon="l-arrow-right"
                              className="text-2xl"
                            />
                          </button>
                        </div>
                      )}
                      <div className="flex flex-row gap-1">
                        <button
                          className="w-full rounded-md border border-white bg-green-100 p-2  text-black hover:bg-green-500 hover:text-white"
                          onClick={() => {
                            setToAddPreset(true);
                          }}
                          disabled={toUpdateBoundary}
                        >
                          <CareIcon className="care-l-plus" /> Add Preset
                        </button>
                        {props?.showRefreshButton && (
                          <button
                            className="w-full rounded-md border border-white bg-green-100 p-2 text-black hover:bg-green-500 hover:text-white"
                            onClick={() => {
                              getBedPresets(cameraAsset?.id);
                              fetchCameraPresets();
                            }}
                          >
                            <CareIcon className="care-l-redo" /> Refresh
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};

export default LiveFeed;
