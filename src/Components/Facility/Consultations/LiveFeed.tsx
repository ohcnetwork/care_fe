/* eslint-disable eqeqeq */
import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import screenfull from "screenfull";
import useKeyboardShortcut from "use-keyboard-shortcut";
import loadable from "@loadable/component";
import {
  listAssetBeds,
  partialUpdateAssetBed,
  deleteAssetBed,
} from "../../../Redux/actions";
import RefreshIcon from "@material-ui/icons/Refresh";
import { getCameraPTZ } from "../../../Common/constants";
import {
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import { useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
const PageTitle = loadable(() => import("../../Common/PageTitle"));
import * as Notification from "../../../Utils/Notifications.js";
import {
  Card,
  CardContent,
  InputLabel,
  Modal,
  Tooltip,
} from "@material-ui/core";
import { FeedCameraPTZHelpButton } from "./Feed";
import { AxiosError } from "axios";
import { isNull } from "lodash";
import { BedSelect } from "../../Common/BedSelect";
import { BedModel } from "../models";
import { TextInputField } from "../../Common/HelperInputFields";
import useWindowDimensions from "../../../Common/hooks/useWindowDimensions";

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
      if (!(screenfull.isEnabled && liveFeedPlayerRef.current)) return;
      screenfull.request(liveFeedPlayerRef.current);
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
    <div className="mt-4 px-6 mb-2">
      <PageTitle title="Live Feed" hideBack={true} />

      {toDelete && (
        <Modal
          className="flex h-fit justify-center items-center top-1/2"
          open={!isNull(toDelete)}
        >
          <Card>
            <CardContent>
              <h5>
                Confirm delete preset: {toDelete.meta.preset_name} (in bed:{" "}
                {toDelete.bed_object.name})?
              </h5>
              <hr />
              <div className="flex gap-3 justify-end mt-2">
                <button
                  className="bg-red-500 px-3 text-sm py-1 rounded-md text-white"
                  onClick={() => deletePreset(toDelete.id)}
                >
                  Confirm
                </button>
                <button className="text-sm" onClick={() => setToDelete(null)}>
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </Modal>
      )}
      {toUpdate && (
        <Modal
          className="flex h-fit justify-center items-center top-1/2"
          open={!isNull(toUpdate)}
        >
          <Card>
            <CardContent>
              <h5>Update Preset</h5>
              <hr />
              <div>
                <InputLabel id="asset-type">Bed</InputLabel>
                <BedSelect
                  name="bed"
                  setSelected={(selected) => setBed(selected as BedModel)}
                  selected={bed}
                  errors=""
                  multiple={false}
                  margin="dense"
                  location={cameraAsset.location_id}
                  facility={cameraAsset.facility_id}
                />
              </div>
              <div>
                <InputLabel id="location">Preset Name</InputLabel>
                <TextInputField
                  name="name"
                  id="location"
                  variant="outlined"
                  margin="dense"
                  type="text"
                  value={preset}
                  onChange={(e) => setNewPreset(e.target.value)}
                  errors=""
                />
              </div>

              <div className="flex gap-3 justify-end mt-2">
                <button
                  onClick={() => updatePreset(toUpdate)}
                  className="bg-red-500 px-3 text-sm py-1 rounded-md text-white"
                >
                  Confirm
                </button>
                <button className="text-sm" onClick={() => setToUpdate(null)}>
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </Modal>
      )}
      <div className="mt-4 flex flex-col">
        <div className="flex flex-col lg:flex-row gap-4 mt-4 relative">
          <div className="flex-1">
            {/* ADD VIDEO PLAYER HERE */}
            <div className="mb-4 lg:mb-0 relative feed-aspect-ratio w-full bg-primary-100 rounded">
              <video
                id="mse-video"
                autoPlay
                muted
                playsInline
                className="h-full w-full z-10"
                ref={liveFeedPlayerRef}
              ></video>

              {loading && (
                <div className="absolute right-0 bottom-0 p-4 bg-white bg-opacity-75 rounded-tl">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-b-0 border-primary-500 rounded-full animate-spin an" />
                    <p className="text-base font-bold">{loading}</p>
                  </div>
                </div>
              )}
              {/* { streamStatus > 0 && */}
              <div className="absolute right-0 h-full w-full bottom-0 p-4 flex items-center justify-center">
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
              } max-w-lg mt-4`}
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
                  <Tooltip
                    placement="top"
                    arrow={true}
                    title={
                      <span className="text-sm font-semibold">
                        {`${option.label}  (${shortcutKeyDescription})`}
                      </span>
                    }
                    key={option.action}
                  >
                    <button
                      className="bg-green-100 hover:bg-green-200 border border-green-100 p-2 flex-1"
                      onClick={option.callback}
                    >
                      <span className="sr-only">{option.label}</span>
                      {option.icon ? (
                        <i className={`fas fa-${option.icon} md:p-2`}></i>
                      ) : (
                        <span className="px-2 font-bold h-full w-8 flex items-center justify-center">
                          {option.value}x
                        </span>
                      )}
                    </button>
                  </Tooltip>
                );
              })}
              <div className="pl-3 hideonmobilescreen">
                <FeedCameraPTZHelpButton
                  cameraPTZ={cameraPTZ}
                  tooltipPlacement="top"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col mx-4 max-w-sm">
            <nav className="flex flex-wrap">
              <button
                className={`flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800  ${
                  showDefaultPresets
                    ? "border-primary-500 text-primary-600 border-b-2"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(true);
                }}
              >
                Default Presets
              </button>
              <button
                className={`flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800  ${
                  !showDefaultPresets
                    ? "border-primary-500 text-primary-600 border-b-2"
                    : ""
                }`}
                onClick={() => {
                  setShowDefaultPresets(false);
                }}
              >
                Patient Presets
              </button>
            </nav>
            <div className="w-full space-y-4 my-2">
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
                        className="flex flex-wrap gap-2 w-full max- bg-green-100 border border-white rounded-md p-3 text-black  hover:bg-green-500 hover:text-white truncate"
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
                          className="flex flex-col bg-green-100 border border-white rounded-t-md p-2 text-black  hover:bg-green-500 hover:text-white truncate"
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
                            className="text-green-800 text-sm py-1 bg-green-200 w-1/2 justify-center items-center gap-2 flex hover:bg-green-800 hover:text-green-200 "
                          >
                            <i className="fa-solid fa-pencil"></i>
                          </button>
                          <button
                            onClick={() => setToDelete(preset)}
                            className="text-red-800 text-sm py-1 bg-red-200 w-1/2 justify-center items-center gap-2 flex hover:bg-red-800 hover:text-red-200 "
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
                    className="flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800 hover:bg-gray-300"
                    disabled={presetsPage < 10}
                    onClick={() => {
                      setPresetsPage(presetsPage - 10);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800 hover:bg-gray-300"
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
                    className="flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800 hover:bg-gray-300"
                    disabled={page.offset === 0}
                    onClick={() => {
                      handlePagination(page.offset - page.limit);
                    }}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <button
                    className="flex-1 p-4  font-bold text-center  text-gray-700 hover:text-gray-800 hover:bg-gray-300"
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
                  className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:text-white hover:bg-green-500 w-full"
                  onClick={() => {
                    getBedPresets(cameraAsset?.id);
                    fetchCameraPresets();
                  }}
                >
                  <RefreshIcon /> Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
