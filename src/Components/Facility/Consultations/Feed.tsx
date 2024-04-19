import { useEffect, useRef, useState } from "react";
import {
  CAMERA_STATES,
  CameraPTZ,
  getCameraPTZ,
} from "../../../Common/constants";
import { PTZState, useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
import {
  ICameraAssetState,
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import routes from "../../../Redux/api";
import * as Notification from "../../../Utils/Notifications.js";
import request from "../../../Utils/request/request";

import { useTranslation } from "react-i18next";
import ReactPlayer from "react-player";
import { useDispatch } from "react-redux";
import useKeyboardShortcut from "use-keyboard-shortcut";
import CareIcon, { IconName } from "../../../CAREUI/icons/CareIcon.js";
import useAuthUser from "../../../Common/hooks/useAuthUser.js";
import useFullscreen from "../../../Common/hooks/useFullscreen.js";
import { useHLSPLayer } from "../../../Common/hooks/useHLSPlayer";
import { triggerGoal } from "../../../Integrations/Plausible.js";
import useQuery from "../../../Utils/request/useQuery.js";
import { classNames } from "../../../Utils/utils";
import { ResolvedMiddleware } from "../../Assets/AssetTypes.js";
import Loading from "../../Common/Loading";
import Spinner from "../../Common/Spinner.js";
import { CameraPresetModel } from "../models";
import FeedButton from "./FeedButton";

interface IFeedProps {
  facilityId: string;
  consultationId: any;
}

const PATIENT_DEFAULT_PRESET = "Patient View".trim().toLowerCase();

export const Feed: React.FC<IFeedProps> = ({ consultationId }) => {
  const { t } = useTranslation();
  const dispatch: any = useDispatch();

  const videoWrapper = useRef<HTMLDivElement>(null);

  const [cameraAsset, setCameraAsset] = useState<ICameraAssetState>({
    id: "",
    accessKey: "",
    middleware_address: "",
    location_middleware: "",
  });

  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [bedPresets, setBedPresets] = useState<CameraPresetModel[]>();
  const [bed, setBed] = useState<any>();
  const [precision, setPrecision] = useState(1);
  const [cameraState, setCameraState] = useState<PTZState | null>(null);
  const [isFullscreen, setFullscreen] = useFullscreen();
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [statusReported, setStatusReported] = useState(false);
  const [resolvedMiddleware, setResolvedMiddleware] =
    useState<ResolvedMiddleware>();
  const authUser = useAuthUser();

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

  const { loading: getConsultationLoading } = useQuery(routes.getConsultation, {
    pathParams: { id: consultationId },
    onResponse: ({ res, data }) => {
      if (res && res.status === 200 && data) {
        const consultationBedId = data.current_bed?.bed_object?.id;
        if (consultationBedId) {
          (async () => {
            const { data: listCameraPresetsData } = await request(
              routes.getCameraPresets,
              {
                query: {
                  bed: consultationBedId,
                },
              }
            );
            setBed(consultationBedId);
            if (listCameraPresetsData?.results?.length) {
              const obj = listCameraPresetsData.results[0];
              const { camera_access_key } =
                obj?.asset_bed_object?.asset?.meta || {};
              const config = camera_access_key.split(":");
              setCameraAsset({
                id: obj.asset_bed_object?.asset?.id || "",
                accessKey: config[2] || "",
                middleware_address:
                  obj.asset_bed_object?.asset?.meta?.middleware_hostname,
                location_middleware:
                  obj.asset_bed_object?.asset?.location_object
                    ?.middleware_address || "",
              });
              setResolvedMiddleware(
                obj.asset_bed_object.asset?.resolved_middleware
              );
              const position = {
                x: obj.x || 0.0,
                y: obj.y || 0.0,
                zoom: obj.zoom || 1,
              };
              setCameraConfig({
                ...position,
              });
              setCameraState({
                ...position,
                precision: 1,
              });
            }
          })();
        }
      }
    },
  });

  // const [position, setPosition] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [presets, setPresets] = useState<any>([]);
  const [currentPreset, setCurrentPreset] = useState<CameraPresetModel>();
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
    ? `wss://${resolvedMiddleware?.hostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`
    : `https://${resolvedMiddleware?.hostname}/stream/${cameraAsset?.accessKey}/channel/0/hls/live/index.m3u8?uuid=${cameraAsset?.accessKey}&channel=0`;

  const {
    startStream,
    // setVideoEl,
  } = isIOS
    ? // eslint-disable-next-line react-hooks/rules-of-hooks
      useHLSPLayer(liveFeedPlayerRef.current as ReactPlayer)
    : // eslint-disable-next-line react-hooks/rules-of-hooks
      useMSEMediaPlayer({
        config: {
          middlewareHostname: resolvedMiddleware?.hostname ?? "",
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

  const calculateVideoLiveDelay = () => {
    const video = liveFeedPlayerRef.current as HTMLVideoElement;
    if (!video || !videoStartTime) return 0;

    const timeDifference =
      (new Date().getTime() - videoStartTime.getTime()) / 1000;

    return timeDifference - video.currentTime;
  };

  const getBedPresets = async (asset: any) => {
    if (asset.id && bed) {
      const { data: cameraPresets } = await request(routes.getCameraPresets, {
        query: { asset: asset.id, bed },
      });
      setBedPresets(cameraPresets?.results);
    }
  };

  const startStreamFeed = () => {
    startStream({
      onSuccess: () => setStreamStatus(StreamStatus.Playing),
      onError: () => {
        setStreamStatus(StreamStatus.Offline);
        if (!statusReported) {
          triggerGoal("Camera Feed Viewed", {
            consultationId,
            userId: authUser.id,
            result: "error",
          });
          setStatusReported(true);
        }
      },
    });
  };

  useEffect(() => {
    if (cameraAsset.id) {
      setTimeout(() => {
        startStreamFeed();
      }, 1000);
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
  }, [cameraAsset, resolvedMiddleware?.hostname]);

  useEffect(() => {
    let tId: any;
    if (streamStatus !== StreamStatus.Playing) {
      if (streamStatus !== StreamStatus.Offline) {
        setStreamStatus(StreamStatus.Loading);
      }
      tId = setTimeout(() => {
        startStreamFeed();
      }, 5000);
    } else if (!statusReported) {
      triggerGoal("Camera Feed Viewed", {
        consultationId,
        userId: authUser.id,
        result: "success",
      });
      setStatusReported(true);
    }

    return () => {
      clearTimeout(tId);
    };
  }, [startStream, streamStatus]);

  useEffect(() => {
    if (!currentPreset && streamStatus === StreamStatus.Playing) {
      setLoading(CAMERA_STATES.MOVING.GENERIC);
      const preset =
        bedPresets?.find(
          (preset: CameraPresetModel) =>
            String(preset?.preset_name).trim().toLowerCase() ===
            PATIENT_DEFAULT_PRESET
        ) || bedPresets?.[0];

      if (preset) {
        absoluteMove(
          {
            x: preset?.x || 0,
            y: preset?.y || 0,
            zoom: preset?.zoom || 1,
          },
          {
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
          }
        );
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
      setVideoStartTime(null);
      startStream({
        onSuccess: () => setStreamStatus(StreamStatus.Playing),
        onError: () => setStreamStatus(StreamStatus.Offline),
      });
    },
    fullScreen: () => {
      if (isIOS) {
        const element = document.querySelector("video");
        if (!element) return;
        setFullscreen(true, element as HTMLElement);
        return;
      }
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
          if (currentPreset?.asset_bed_object?.asset?.id && data?.position) {
            setLoading(option.loadingLabel);
            console.log("Updating Preset");
            const { res } = await request(routes.partialUpdateAssetBed, {
              body: {
                asset: currentPreset.asset_bed_object?.asset?.id,
                bed: currentPreset.asset_bed_object?.bed?.id,
                meta: {
                  external_id: currentPreset?.id,
                  x: data?.position?.x,
                  y: data?.position?.y,
                  zoom: data?.position?.zoom,
                },
              },
              pathParams: {
                external_id: currentPreset?.asset_bed_object?.id || "",
              },
            });
            if (res && res.status === 200) {
              Notification.Success({ msg: "Preset Updated" });
              await getBedPresets(cameraAsset?.id);
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

  if (getConsultationLoading) return <Loading />;

  return (
    <div className="flex h-[calc(100vh-1.5rem)] flex-col px-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 px-3">
          <p className="block text-lg font-medium">{t("camera_presets")}: </p>
          <div className="flex items-center">
            {bedPresets?.map((preset: CameraPresetModel, index: number) => (
              <button
                key={preset.id}
                onClick={() => {
                  setLoading(CAMERA_STATES.MOVING.GENERIC);
                  // gotoBedPreset(preset);
                  absoluteMove(
                    {
                      x: preset?.x || 0.0,
                      y: preset?.y || 0.0,
                      zoom: preset?.zoom || 1,
                    },
                    {
                      onSuccess: () => {
                        setLoading(CAMERA_STATES.IDLE);
                        setCurrentPreset(preset);
                        console.log(
                          "onSuccess: Set Preset to " + preset?.preset_name
                        );
                        triggerGoal("Camera Preset Clicked", {
                          presetName: preset?.preset_name,
                          consultationId,
                          userId: authUser.id,
                          result: "success",
                        });
                      },
                      onError: () => {
                        setLoading(CAMERA_STATES.IDLE);
                        setCurrentPreset(preset);
                        console.log(
                          "onError: Set Preset to " + preset?.preset_name
                        );
                        triggerGoal("Camera Preset Clicked", {
                          presetName: preset?.preset_name,
                          consultationId,
                          userId: authUser.id,
                          result: "error",
                        });
                      },
                    }
                  );
                  getCameraStatus({});
                }}
                className={classNames(
                  "block border border-gray-500 px-4 py-2 first:rounded-l last:rounded-r",
                  currentPreset === preset
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "bg-transparent"
                )}
              >
                {preset.preset_name || `Preset ${index + 1}`}
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
            onPlay={() => {
              setVideoStartTime(() => new Date());
            }}
            width="100%"
            height="100%"
            onBuffer={() => {
              const delay = calculateVideoLiveDelay();
              if (delay > 5) {
                setStreamStatus(StreamStatus.Loading);
              }
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
            onPlay={() => {
              setVideoStartTime(() => new Date());
            }}
            onWaiting={() => {
              const delay = calculateVideoLiveDelay();
              if (delay > 5) {
                setStreamStatus(StreamStatus.Loading);
              }
            }}
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
                {t("status")}:{" "}
                <span className="text-red-600">{t("offline")}</span>
              </p>
              <p className="font-semibold ">
                {t("feed_is_currently_not_live")}
              </p>
              <p className="font-semibold ">Trying to connect... </p>
              <p className="mt-2 flex justify-center">
                <Spinner circle={{ fill: "none" }} />
              </p>
            </div>
          )}
          {streamStatus === StreamStatus.Stop && (
            <div className="text-center">
              <p className="font-bold">
                {t("status")}:{" "}
                <span className="text-red-600">{t("stopped")}</span>
              </p>
              <p className="font-semibold ">{t("feed_is_stopped")}</p>
              <p className="font-semibold ">
                {t("click_refresh_button_to_start_feed")}
              </p>
            </div>
          )}
          {streamStatus === StreamStatus.Loading && (
            <div className="text-center">
              <p className="font-bold ">
                {t("status")}:{" "}
                <span className="text-red-600"> {t("loading")}</span>
              </p>
              <p className="font-semibold ">{t("fetching_latest_feed")}</p>
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
          <div className="hidden pl-3 md:block">
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
        {streamStatus === StreamStatus.Playing &&
          calculateVideoLiveDelay() > 3 && (
            <div className="absolute left-8 top-8 z-10 flex items-center gap-2 rounded-3xl bg-red-400 px-3 py-1.5 text-xs font-semibold text-gray-100">
              <CareIcon icon="l-wifi-slash" className="h-4 w-4" />
              <span>{t("slow_network_detected")}</span>
            </div>
          )}
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
                      className="rounded-md border border-gray-500 p-1.5 font-mono shadow-md"
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
