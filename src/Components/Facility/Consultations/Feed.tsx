import * as Notification from "../../../Utils/Notifications.js";

import {
  CAMERA_STATES,
  CameraPTZ,
  getCameraPTZ,
} from "../../../Common/constants";
import {
  ICameraAssetState,
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import { PTZState, useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getConsultation,
  getPermittedFacility,
  listAssetBeds,
  partialUpdateAssetBed,
} from "../../../Redux/actions";
import { statusType, useAbortableEffect } from "../../../Common/utils";

import CareIcon from "../../../CAREUI/icons/CareIcon.js";
import { ConsultationModel } from "../models";
import FeedButton from "./FeedButton";
import Loading from "../../Common/Loading";
import ReactPlayer from "react-player";
import { classNames } from "../../../Utils/utils";
import { useDispatch } from "react-redux";
import { useHLSPLayer } from "../../../Common/hooks/useHLSPlayer";
import useKeyboardShortcut from "use-keyboard-shortcut";
import useFullscreen from "../../../Common/hooks/useFullscreen.js";
import { triggerGoal } from "../../Common/Plausible.js";
import useAuthUser from "../../../Common/hooks/useAuthUser.js";

interface IFeedProps {
  facilityId: string;
  consultationId: any;
}
const PATIENT_DEFAULT_PRESET = "Patient View".trim().toLowerCase();

export const Feed: React.FC<IFeedProps> = ({ consultationId, facilityId }) => {
  const dispatch: any = useDispatch();

  const videoWrapper = useRef<HTMLDivElement>(null);

  const [cameraAsset, setCameraAsset] = useState<ICameraAssetState>({
    id: "",
    accessKey: "",
  });
  const [cameraMiddlewareHostname, setCameraMiddlewareHostname] = useState("");
  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [bed, setBed] = useState<any>();
  const [precision, setPrecision] = useState(1);
  const [cameraState, setCameraState] = useState<PTZState | null>(null);
  const [isFullscreen, setFullscreen] = useFullscreen();
  const authUser = useAuthUser();

  useEffect(() => {
    const fetchFacility = async () => {
      const res = await dispatch(getPermittedFacility(facilityId));

      if (res.status === 200 && res.data) {
        setCameraMiddlewareHostname(res.data.middleware_address);
      }
    };

    if (facilityId) fetchFacility();
  }, [dispatch, facilityId]);

  useEffect(() => {
    if (cameraState) {
      setCameraState({
        ...cameraState,
        precision: precision,
      });
    }
  }, [precision]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setCameraState({
        ...cameraConfig.position,
        precision: cameraState?.precision,
      });
      setCamTimeout(0);
    }, 5000);
    return () => clearTimeout(timeout);
  }, [cameraState]);

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const liveFeedPlayerRef = useRef<HTMLVideoElement | ReactPlayer | null>(null);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultation(consultationId));
      if (!status.aborted && res.data) {
        const consultation = res.data as ConsultationModel;
        const consultationBedId = consultation.current_bed?.bed_object?.id;
        if (consultationBedId) {
          let bedAssets = await dispatch(
            listAssetBeds({ bed: consultationBedId })
          );
          setBed(consultationBedId);
          bedAssets = {
            ...bedAssets,
            data: {
              ...bedAssets.data,
              results: bedAssets.data.results.filter(
                (asset: { asset_object: { meta: { asset_type: string } } }) => {
                  return asset?.asset_object?.meta?.asset_type === "CAMERA"
                    ? true
                    : false;
                }
              ),
            },
          };

          if (bedAssets?.data?.results?.length) {
            const { camera_access_key } =
              bedAssets.data.results[0].asset_object.meta;
            const config = camera_access_key.split(":");
            setCameraAsset({
              id: bedAssets.data.results[0].asset_object.id,
              accessKey: config[2] || "",
            });
            setCameraConfig(bedAssets.data.results[0].meta);
            setCameraState({
              ...bedAssets.data.results[0].meta.position,
              precision: 1,
            });
          }
        }

        setIsLoading(false);
      }
    },
    [consultationId, dispatch]
  );

  // const [position, setPosition] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [presets, setPresets] = useState<any>([]);
  const [currentPreset, setCurrentPreset] = useState<any>();
  // const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);

  const [loading, setLoading] = useState<string>(CAMERA_STATES.IDLE);
  const [camTimeout, setCamTimeout] = useState<number>(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (cameraState) {
        cameraPTZ[5].callback(camTimeout - cameraState.zoom);
        setCameraState({
          ...cameraState,
          zoom: camTimeout,
        });
      }
    }, 1000);
    return () => clearTimeout(timeout);
  }, [camTimeout]);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );

  const url = !isIOS
    ? `wss://${cameraMiddlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`
    : `https://${cameraMiddlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/hls/live/index.m3u8?uuid=${cameraAsset?.accessKey}&channel=0`;

  const {
    startStream,
    // setVideoEl,
  } = isIOS
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useHLSPLayer(liveFeedPlayerRef.current as ReactPlayer)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useMSEMediaPlayer({
        config: {
          middlewareHostname: cameraMiddlewareHostname,
          ...cameraAsset,
        },
        url,
        videoEl: liveFeedPlayerRef.current as HTMLVideoElement,
      });

  const {
    absoluteMove,
    getCameraStatus,
    getPTZPayload,
    getPresets,
    relativeMove,
  } = useFeedPTZ({
    config: cameraAsset,
    dispatch,
  });

  const getBedPresets = async (asset: any) => {
    if (asset.id && bed) {
      const bedAssets = await dispatch(listAssetBeds({ asset: asset.id, bed }));
      setBedPresets(bedAssets?.data?.results);
    }
  };

  useEffect(() => {
    if (cameraAsset.id) {
      getPresets({
        onSuccess: (resp) => setPresets(resp),
        onError: (_) => {
          Notification.Error({
            msg: "Fetching presets failed",
          });
        },
      });
      getBedPresets(cameraAsset);
    }
  }, [cameraAsset, cameraMiddlewareHostname]);

  useEffect(() => {
    let tId: any;
    if (streamStatus !== StreamStatus.Playing) {
      setStreamStatus(StreamStatus.Loading);
      tId = setTimeout(() => {
        startStream({
          onSuccess: () => setStreamStatus(StreamStatus.Playing),
          onError: () => setStreamStatus(StreamStatus.Offline),
        });
      }, 100);
    }

    return () => {
      clearTimeout(tId);
    };
  }, [startStream, streamStatus]);

  useAbortableEffect((status: statusType) => {
    fetchData(status);
  }, []);

  useEffect(() => {
    if (streamStatus === StreamStatus.Playing) {
      setLoading(CAMERA_STATES.MOVING.GENERIC);
      const preset =
        bedPresets?.find(
          (preset: any) =>
            String(preset?.meta?.preset_name).trim().toLowerCase() ===
            PATIENT_DEFAULT_PRESET
        ) || bedPresets?.[0];

      if (preset) {
        absoluteMove(preset?.meta?.position, {
          onSuccess: () => {
            setLoading(CAMERA_STATES.IDLE);
            setCurrentPreset(preset);
          },
          onError: (err: Record<any, any>) => {
            setLoading(CAMERA_STATES.IDLE);
            const responseData = err.data.result;
            if (responseData.status) {
              switch (responseData.status) {
                case "error":
                  if (responseData.error.code === "EHOSTUNREACH") {
                    Notification.Error({ msg: "Camera is Offline!" });
                  } else if (responseData.message) {
                    Notification.Error({ msg: responseData.message });
                  }
                  break;
                case "fail":
                  responseData.errors &&
                    responseData.errors.map((error: any) => {
                      Notification.Error({ msg: error.message });
                    });
                  break;
              }
            } else {
              Notification.Error({ msg: "Unable to connect server!" });
            }
            setCurrentPreset(preset);
          },
        });
      } else {
        setLoading(CAMERA_STATES.IDLE);
      }
    }
  }, [bedPresets, streamStatus]);

  const cameraPTZActionCBs: {
    [key: string]: (option: any, value?: any) => void;
  } = {
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
      setFullscreen(
        !isFullscreen,
        videoWrapper.current
          ? videoWrapper.current
          : (liveFeedPlayerRef.current as HTMLElement)
      );
    },
    updatePreset: (option) => {
      getCameraStatus({
        onSuccess: async (data) => {
          if (currentPreset?.asset_object?.id && data?.position) {
            setLoading(option.loadingLabel);
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
              getPresets({});
            }
            setLoading(CAMERA_STATES.IDLE);
          }
        },
      });
    },
    other: (option, value) => {
      setLoading(option.loadingLabel);
      relativeMove(getPTZPayload(option.action, precision, value), {
        onSuccess: () => setLoading(CAMERA_STATES.IDLE),
      });
    },
  };

  const cameraPTZ = getCameraPTZ(precision).map((option) => {
    const cb =
      cameraPTZActionCBs[
        cameraPTZActionCBs[option.action] ? option.action : "other"
      ];
    return { ...option, callback: (value?: any) => cb(option, value) };
  });

  // Voluntarily disabling eslint, since length of `cameraPTZ` is constant and
  // hence shall not cause issues. (https://news.ycombinator.com/item?id=24363703)
  for (const option of cameraPTZ) {
    if (!option.shortcutKey) continue;
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useKeyboardShortcut(option.shortcutKey, option.callback);
  }

  if (isLoading) return <Loading />;

  return (
    <div className="flex h-[calc(100vh-1.5rem)] flex-col px-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 px-3">
          <p className="block text-lg font-medium"> Camera Presets :</p>
          <div className="flex items-center">
            {bedPresets?.map((preset: any, index: number) => (
              <button
                key={preset.id}
                onClick={() => {
                  setLoading(CAMERA_STATES.MOVING.GENERIC);
                  // gotoBedPreset(preset);
                  absoluteMove(preset.meta.position, {
                    onSuccess: () => {
                      setLoading(CAMERA_STATES.IDLE);
                      setCurrentPreset(preset);
                      console.log(
                        "onSuccess: Set Preset to " + preset?.meta?.preset_name
                      );
                      triggerGoal("Camera Preset Clicked", {
                        presetName: preset?.meta?.preset_name,
                        consultationId,
                        userId: authUser.id,
                        result: "success",
                      });
                    },
                    onError: () => {
                      setLoading(CAMERA_STATES.IDLE);
                      setCurrentPreset(preset);
                      console.log(
                        "onError: Set Preset to " + preset?.meta?.preset_name
                      );
                      triggerGoal("Camera Preset Clicked", {
                        presetName: preset?.meta?.preset_name,
                        consultationId,
                        userId: authUser.id,
                        result: "error",
                      });
                    },
                  });
                  getCameraStatus({});
                }}
                className={classNames(
                  "block border border-gray-500 px-4 py-2",
                  currentPreset === preset
                    ? "rounded border-primary-500 bg-primary-500 text-white"
                    : "bg-transparent"
                )}
              >
                {preset.meta.preset_name || `Preset ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="relative flex h-[calc(100vh-1.5rem-90px)] grow-0 items-center justify-center overflow-hidden rounded-xl bg-black"
        ref={videoWrapper}
      >
        {isIOS ? (
          <ReactPlayer
            url={url}
            ref={liveFeedPlayerRef.current as any}
            controls={false}
            playsinline={true}
            playing={true}
            muted={true}
            width="100%"
            height="100%"
            onBuffer={() => {
              setStreamStatus(StreamStatus.Loading);
            }}
            onError={(e: any, _: any, hlsInstance: any) => {
              if (e === "hlsError") {
                const recovered = hlsInstance.recoverMediaError();
                console.log(recovered);
              }
            }}
            onEnded={() => {
              setStreamStatus(StreamStatus.Stop);
            }}
          />
        ) : (
          <video
            id="mse-video"
            autoPlay
            muted
            playsInline
            className="max-h-full max-w-full"
            ref={liveFeedPlayerRef as any}
          />
        )}

        {loading !== CAMERA_STATES.IDLE && (
          <div className="absolute inset-x-0 top-2 flex items-center justify-center text-center">
            <div className="inline-flex items-center gap-2 rounded bg-white/70 p-4">
              <div className="an h-4 w-4 animate-spin rounded-full border-2 border-b-0 border-primary-500" />
              <p className="text-base font-bold">{loading}</p>
            </div>
          </div>
        )}
        <div className="absolute bottom-0 right-0 flex h-full w-full items-center justify-center p-4 text-white">
          {streamStatus === StreamStatus.Offline && (
            <div className="text-center">
              <p className="font-bold">
                STATUS: <span className="text-red-600">OFFLINE</span>
              </p>
              <p className="font-semibold ">Feed is currently not live.</p>
              <p className="font-semibold ">
                Click refresh button to try again.
              </p>
            </div>
          )}
          {streamStatus === StreamStatus.Stop && (
            <div className="text-center">
              <p className="font-bold">
                STATUS: <span className="text-red-600">STOPPED</span>
              </p>
              <p className="font-semibold ">Feed is Stooped.</p>
              <p className="font-semibold ">
                Click refresh button to start feed.
              </p>
            </div>
          )}
          {streamStatus === StreamStatus.Loading && (
            <div className="text-center">
              <p className="font-bold ">
                STATUS: <span className="text-red-600"> LOADING</span>
              </p>
              <p className="font-semibold ">Fetching latest feed.</p>
            </div>
          )}
        </div>
        <div className="absolute right-8 top-8 z-10 flex flex-col gap-4">
          {["fullScreen", "reset", "updatePreset", "zoomIn", "zoomOut"].map(
            (button, index) => {
              const option = cameraPTZ.find(
                (option) => option.action === button
              );
              return (
                <FeedButton
                  key={index}
                  camProp={option}
                  styleType="CHHOTUBUTTON"
                  clickAction={() => option?.callback()}
                />
              );
            }
          )}
          <div className="hideonmobilescreen pl-3">
            <FeedCameraPTZHelpButton cameraPTZ={cameraPTZ} />
          </div>
        </div>
        <div className="absolute bottom-8 right-8 z-10">
          <FeedButton
            camProp={cameraPTZ[4]}
            styleType="CHHOTUBUTTON"
            clickAction={() => cameraPTZ[4].callback()}
          />
        </div>
        <div className="absolute bottom-8 left-8 z-10 grid grid-flow-col grid-rows-3 gap-1">
          {[
            false,
            cameraPTZ[2],
            false,
            cameraPTZ[0],
            false,
            cameraPTZ[1],
            false,
            cameraPTZ[3],
            false,
          ].map((c, i) => {
            let out = <div className="h-[60px] w-[60px]" key={i}></div>;
            if (c) {
              const button = c as any;
              out = (
                <FeedButton
                  key={i}
                  camProp={button}
                  styleType="BUTTON"
                  clickAction={() => {
                    triggerGoal("Camera Feed Moved", {
                      direction: button.action,
                      consultationId,
                      userId: authUser.id,
                    });

                    button.callback();
                    if (cameraState) {
                      let x = cameraState.x;
                      let y = cameraState.y;
                      switch (button.action) {
                        case "left":
                          x += -0.1 / cameraState.precision;
                          break;

                        case "right":
                          x += 0.1 / cameraState.precision;
                          break;

                        case "down":
                          y += -0.1 / cameraState.precision;
                          break;

                        case "up":
                          y += 0.1 / cameraState.precision;
                          break;

                        default:
                          break;
                      }

                      setCameraState({ ...cameraState, x: x, y: y });
                    }
                  }}
                />
              );
            }

            return out;
          })}
        </div>
      </div>
    </div>
  );
};

export const FeedCameraPTZHelpButton = (props: { cameraPTZ: CameraPTZ[] }) => {
  const { cameraPTZ } = props;
  return (
    <button
      key="option.action"
      className="tooltip rounded text-2xl text-gray-600"
    >
      <CareIcon className="care-l-question-circle" />

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
                      className="rounded-md border border-gray-500 p-1.5 font-mono shadow-md"
                    >
                      {isArrowKey ? (
                        <CareIcon className={`care-${option.icon}`} />
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
