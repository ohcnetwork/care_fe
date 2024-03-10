import * as Notification from "../../../Utils/Notifications.js";
import routes from "../../../Redux/api";
import request from "../../../Utils/request/request";
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
import { useEffect, useRef, useState } from "react";
// import { statusType, useAbortableEffect } from "../../../Common/utils";
import ButtonV2 from "../../Common/components/ButtonV2.js";

import CareIcon from "../../../CAREUI/icons/CareIcon.js";
import FeedButton from "./FeedButton";
import Loading from "../../Common/Loading";
import ReactPlayer from "react-player";
import { classNames } from "../../../Utils/utils";
import { useDispatch } from "react-redux";
import { useHLSPLayer } from "../../../Common/hooks/useHLSPlayer";
import useKeyboardShortcut from "use-keyboard-shortcut";
import useFullscreen from "../../../Common/hooks/useFullscreen.js";
import { useMessageListener } from "../../../Common/hooks/useMessageListener.js";
import useNotificationSubscribe from "../../../Common/hooks/useNotificationSubscribe.js";
import { triggerGoal } from "../../../Integrations/Plausible.js";
import useAuthUser from "../../../Common/hooks/useAuthUser.js";
import Spinner from "../../Common/Spinner.js";
import useQuery from "../../../Utils/request/useQuery.js";
import { ResolvedMiddleware } from "../../Assets/AssetTypes.js";

interface IFeedProps {
  facilityId: string;
  consultationId: any;
}

interface cameraOccupier {
  username?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  homeFacility?: string;
}

const PATIENT_DEFAULT_PRESET = "Patient View".trim().toLowerCase();

export const Feed: React.FC<IFeedProps> = ({ facilityId, consultationId }) => {
  const dispatch: any = useDispatch();
  const CAMERA_ACCESS_TIMEOUT = 10 * 60; //seconds

  const videoWrapper = useRef<HTMLDivElement>(null);

  const [cameraAsset, setCameraAsset] = useState<ICameraAssetState>({
    id: "",
    accessKey: "",
    middleware_address: "",
    location_middleware: "",
  });

  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [bed, setBed] = useState<any>();
  const [precision, setPrecision] = useState(1);
  const [cameraState, setCameraState] = useState<PTZState | null>(null);
  const [boundaryPreset, setBoundaryPreset] = useState<any>();
  const [isFullscreen, setFullscreen] = useFullscreen();

  // Information about subscription and camera occupier in case asset is not occupied by the current user
  const [showSubscriptionInfo, setShowSubscriptionInfo] = useState(false);
  const [showCameraOccupierInfo, setShowCameraOccupierInfo] = useState(false);
  const [cameraOccupier, setCameraOccupier] = useState<cameraOccupier>({});
  const [timeoutSeconds, setTimeoutSeconds] = useState(CAMERA_ACCESS_TIMEOUT);
  const [isRequestingAccess, setIsRequestingAccess] = useState<boolean>(false);

  const [borderAlert, setBorderAlert] = useState<any>(null);
  const [privacy, setPrivacy] = useState<boolean>(false);
  const [privacyLockedBy, setPrivacyLockedBy] = useState<string>("");
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
  const [statusReported, setStatusReported] = useState(false);
  const [resolvedMiddleware, setResolvedMiddleware] =
    useState<ResolvedMiddleware>();
  const authUser = useAuthUser();

  // Notification hook to get subscription info
  const {
    subscriptionStatus,
    isSubscribing,
    intialSubscriptionState,
    subscribe,
  } = useNotificationSubscribe();

  useEffect(() => {
    intialSubscriptionState();
  }, [dispatch, subscriptionStatus]);

  // display subscription info
  const subscriptionInfo = () => {
    return (
      <div
        className="relative mb-1 flex flex-col justify-end"
        onMouseLeave={() => {
          setShowSubscriptionInfo(false);
        }}
      >
        {showSubscriptionInfo && (
          <div className="absolute z-10 flex -translate-x-24 translate-y-32 flex-col gap-2 rounded-md bg-white p-2  drop-shadow-md">
            <div className="text-xs">
              {subscriptionStatus != "SubscribedOnThisDevice"
                ? "Subscribe to get real time information about camera access"
                : "You are subscribed, and will get real time information about camera access"}
            </div>
            {subscriptionStatus != "SubscribedOnThisDevice" && (
              <ButtonV2
                onClick={subscribe}
                ghost
                variant="secondary"
                disabled={isSubscribing}
                size="small"
                border
              >
                {isSubscribing && <Spinner />}
                <CareIcon className="care-l-bell" />
                Subscribe
              </ButtonV2>
            )}
          </div>
        )}
        <div
          onMouseEnter={() => {
            setShowSubscriptionInfo(true);
          }}
        >
          <CareIcon className="care-l-info-circle text-xl" />
        </div>
      </div>
    );
  };

  //display current cameraoccupier info incase the asset is not occupied by the current user
  const currentCameraOccupierInfo = () => {
    return (
      <div
        className="relative flex flex-row-reverse"
        onMouseLeave={() => {
          setShowCameraOccupierInfo(false);
        }}
      >
        {showCameraOccupierInfo && (
          <div className="absolute z-10 flex w-48 -translate-x-8 flex-col gap-2 rounded-md bg-white p-2 drop-shadow-md">
            <div className="text-xs text-gray-600">
              Camera is being used by...
            </div>

            <div className="flex flex-col gap-1 text-sm font-semibold">
              <div>{`${cameraOccupier.firstName} ${cameraOccupier.lastName}-`}</div>
              <div className="text-green-600">{`${cameraOccupier.role}`}</div>
            </div>
            {cameraOccupier.homeFacility && (
              <div className="text-sm">{`${cameraOccupier.homeFacility}`}</div>
            )}
            <ButtonV2
              onClick={() => {
                setIsRequestingAccess(true);
                requestAccess({
                  onSuccess: () => {
                    Notification.Success({ msg: "Request sent" });
                    setIsRequestingAccess(false);
                  },
                  onError: () => {
                    Notification.Error({ msg: "Request failed" });
                    setIsRequestingAccess(false);
                  },
                });
              }}
              ghost
              variant="secondary"
              size="small"
              border
            >
              {isRequestingAccess && <Spinner />}
              Request Access
            </ButtonV2>
          </div>
        )}
        <div
          className="h-8 w-8 items-center  rounded-full border-2 border-green-500 bg-white text-center"
          onMouseEnter={() => {
            setShowCameraOccupierInfo(true);
          }}
        >
          <div className="mb-1 text-2xl font-bold text-green-600">
            {cameraOccupier?.firstName?.[0] ? (
              cameraOccupier?.firstName?.[0].toUpperCase()
            ) : (
              <CareIcon className="care-l-user" />
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchFacility = async () => {
      const { data, res } = await request(routes.getPermittedFacility, {
        pathParams: { id: facilityId },
      });

      if (res?.ok && data) {
        setResolvedMiddleware({
          hostname: data?.middleware_address ?? "",
          source: "asset",
        });
        // setFacilityMiddlewareHostname(res.data.middleware_address);
        //   useQuery(routes.getPermittedFacilities, {
        //     pathParams: { id: facilityId || "" },
        //     onResponse: ({ res, data }) => {
        //       if (res && res.status === 200 && data && data.middleware_address) {
        //         setFacilityMiddlewareHostname(data.middleware_address);
      }
    };

    fetchFacility();
  }, []);

  // const fallbackMiddleware =
  //   cameraAsset.location_middleware || resolvedMiddleware;

  // const currentMiddleware =
  //   cameraAsset.middleware_address || fallbackMiddleware;

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
    onResponse: async ({ res, data }) => {
      if (res && res.status === 200 && data) {
        const consultationBedId = data.current_bed?.bed_object?.id;
        if (consultationBedId) {
          const { res: listAssetBedsRes, data: listAssetBedsData } =
            await request(routes.listAssetBeds, {
              query: {
                bed: consultationBedId,
              },
            });
          setBed(consultationBedId);

          const bedAssets: any = {
            ...listAssetBedsRes,
            data: {
              ...listAssetBedsData,
              results: listAssetBedsData?.results.filter((asset) => {
                return asset?.asset_object?.meta?.asset_type === "CAMERA";
              }),
            },
          };

          if (bedAssets?.data?.results?.length) {
            bedAssets.data.results = bedAssets.data.results.filter(
              (bedAsset: any) => bedAsset.meta.type !== "boundary"
            );
            if (bedAssets.data?.results?.length) {
              const { camera_access_key } =
                bedAssets.data.results[0].asset_object.meta;
              const config = camera_access_key.split(":");
              setCameraAsset({
                id: bedAssets.data.results[0].asset_object.id,
                accessKey: config[2] || "",
                middleware_address:
                  bedAssets.data.results[0].asset_object?.meta
                    ?.middleware_hostname,
                location_middleware:
                  bedAssets.data.results[0].asset_object.location_object
                    ?.middleware_address,
              });
              setCameraConfig(bedAssets.data.results[0].meta);
              setCameraState({
                ...bedAssets.data.results[0].meta.position,
                precision: 1,
              });
            }
          }
          if (data?.current_bed?.privacy) {
            setPrivacy(data?.current_bed?.privacy);
            setPrivacyLockedBy(data?.current_bed?.meta?.locked_by);
          }
        }
      }
    },
  });

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
    lockAsset,
    unlockAsset,
    requestAccess,
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
      const { data } = await request(routes.listAssetBeds, {
        query: { asset: asset.id, bed },
      });
      if (data?.results?.length) {
        data.results = data.results.filter((bedAsset: any) => {
          if (bedAsset.meta.type === "boundary") {
            setBoundaryPreset(bedAsset);
            return false;
          } else {
            return true;
          }
        });
      }
      setBedPresets(data?.results);
      //       const { data: bedAssets } = await request(routes.listAssetBeds, {
      //         query: { asset: asset.id, bed },
      //       });
      //       setBedPresets(bedAssets?.results);
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
        onSuccess: (resp) => {
          setPresets(resp);
          setCameraOccupier({});
        },
        onError: (resp) => {
          if (resp.status === 409) {
            setCameraOccupier(resp.data as cameraOccupier);
            Notification.Error({
              msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
            });
          } else {
            setCameraOccupier({});
          }
          Notification.Error({
            msg: "Fetching presets failed",
          });
        },
      });
      getBedPresets(cameraAsset);
    }
  }, [cameraAsset, resolvedMiddleware?.hostname]);

  //lock and unlock asset on mount and unmount
  useEffect(() => {
    if (cameraAsset.id) {
      lockAsset({
        onError: async (resp) => {
          if (resp.status === 409) {
            setCameraOccupier(resp.data as cameraOccupier);
          }
        },
        onSuccess() {
          setCameraOccupier({});
        },
      });
    }

    window.addEventListener("beforeunload", () => {
      if (cameraAsset.id) {
        unlockAsset({});
      }
    });

    return () => {
      if (cameraAsset.id) {
        unlockAsset({});
      }
      window.removeEventListener("beforeunload", () => {
        if (cameraAsset.id) {
          unlockAsset({});
        }
      });
    };
  }, [cameraAsset.id]);

  //count down from CAMERA_ACCESS_TIMEOUT when mouse is idle to unlock asset after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeoutSeconds((prevSeconds) => prevSeconds - 1);
    }, 1000);

    const resetTimer = () => {
      setTimeoutSeconds(CAMERA_ACCESS_TIMEOUT);
    };

    document.addEventListener("mousemove", resetTimer);

    if (cameraOccupier.username) {
      clearInterval(interval);
      setTimeoutSeconds(CAMERA_ACCESS_TIMEOUT);
      removeEventListener("mousemove", resetTimer);
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener("mousemove", resetTimer);
    };
  }, [cameraOccupier]);

  //unlock asset after timeout
  useEffect(() => {
    if (timeoutSeconds === 0) {
      unlockAsset({});
      setTimeoutSeconds(CAMERA_ACCESS_TIMEOUT);
      setTimeout(() => {
        lockAsset({
          onError: async (resp) => {
            if (resp.status === 409) {
              setCameraOccupier(resp.data as cameraOccupier);
            }
          },
          onSuccess() {
            setCameraOccupier({});
          },
        });
      }, 2000);
    }
  }, [timeoutSeconds]);

  //Listen to push notifications for-
  //1) camera access request
  //2) camera access granted
  useMessageListener((data) => {
    if (data?.status == "success" && data?.asset_id === cameraAsset?.id) {
      lockAsset({
        onError: async (resp) => {
          if (resp.status === 409) {
            setCameraOccupier(resp.data as cameraOccupier);
          }
        },
        onSuccess: () => {
          setCameraOccupier({});
          setTimeoutSeconds(CAMERA_ACCESS_TIMEOUT);
        },
      });
    } else if (data.status == "request") {
      Notification.Warn({
        msg: `${data?.firstName} ${data?.lastName} is requesting access to the camera`,
      });
    }
  });

  useEffect(() => {
    let tId: NodeJS.Timeout;
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
  }, [startStream, streamStatus, authUser.id, consultationId, statusReported]);

  useEffect(() => {
    if (!currentPreset && streamStatus === StreamStatus.Playing) {
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
            setCameraOccupier({});
          },
          onError: (err: Record<any, any>) => {
            if (err.status === 409) {
              setCameraOccupier(err.data as cameraOccupier);
              Notification.Error({
                msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
              });
            } else {
              setCameraOccupier({});
            }
            setLoading(CAMERA_STATES.IDLE);
            const responseData = err.data.result;
            if (responseData?.status) {
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

  const borderFlash: (dir: any) => void = (dir: any) => {
    setBorderAlert(dir);
    setTimeout(() => {
      setBorderAlert(null);
    }, 3000);
  };

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
          setCameraOccupier({});
          if (currentPreset?.asset_object?.id && data?.position) {
            setLoading(option.loadingLabel);
            const { res, data: assetBedData } = await request(
              routes.partialUpdateAssetBed,
              {
                body: {
                  asset: currentPreset.asset_object.id,
                  bed: currentPreset.bed_object.id,
                  meta: {
                    ...currentPreset.meta,
                    position: data?.position,
                  },
                },
                pathParams: { external_id: currentPreset?.id },
              }
            );
            if (res && assetBedData && res.status === 200) {
              Notification.Success({ msg: "Preset Updated" });
              getBedPresets(cameraAsset?.id);
              getPresets({
                onSuccess: () => {
                  setCameraOccupier({});
                },
                onError: (resp) => {
                  if (resp.status === 409) {
                    setCameraOccupier(resp.data as cameraOccupier);
                    Notification.Error({
                      msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
                    });
                  } else {
                    setCameraOccupier({});
                  }
                },
              });
              //               await getBedPresets(cameraAsset?.id);
              //               getPresets({});
            }
            setLoading(CAMERA_STATES.IDLE);
          }
        },
        onError: (resp) => {
          if (resp.status === 409) {
            setCameraOccupier(resp.data as cameraOccupier);
            Notification.Error({
              msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
            });
          } else {
            setCameraOccupier({});
          }
        },
      });
    },
    other: (option, value) => {
      setLoading(option.loadingLabel);
      let payLoad = getPTZPayload(option.action, precision, value);
      if (boundaryPreset?.meta?.range && cameraState) {
        const range = boundaryPreset.meta.range;
        if (option.action == "up" && cameraState.y + payLoad.y > range.max_y) {
          borderFlash("top");
          setLoading(CAMERA_STATES.IDLE);
          return;
        } else if (
          option.action == "down" &&
          cameraState.y + payLoad.y < range.min_y
        ) {
          borderFlash("bottom");
          setLoading(CAMERA_STATES.IDLE);
          return;
        } else if (
          option.action == "left" &&
          cameraState.x + payLoad.x < range.min_x
        ) {
          borderFlash("left");
          setLoading(CAMERA_STATES.IDLE);
          return;
        } else if (
          option.action == "right" &&
          cameraState.x + payLoad.x > range.max_x
        ) {
          borderFlash("right");
          setLoading(CAMERA_STATES.IDLE);
          return;
        } else if (
          option.action == "zoomOut" &&
          cameraState.zoom + payLoad.zoom < 0
        ) {
          Notification.Error({ msg: "Cannot zoom out" });
          setLoading(CAMERA_STATES.IDLE);
          return;
        }
      }
      //insert boundaryPreset.id in payload
      if (boundaryPreset?.id) {
        payLoad = {
          ...payLoad,
          id: boundaryPreset.id,
          camera_state: cameraState,
        };
      }

      relativeMove(payLoad, {
        onSuccess: () => {
          setLoading(CAMERA_STATES.IDLE);
          setCameraOccupier({});
        },
        onError: async (resp) => {
          if (resp.status === 409) {
            setCameraOccupier(resp.data as cameraOccupier);
            Notification.Error({
              msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
            });
          } else {
            setCameraOccupier({});
          }
          setLoading(CAMERA_STATES.IDLE);
        },
      });
      if (cameraState) {
        let x = cameraState.x;
        let y = cameraState.y;
        let zoom = cameraState.zoom;
        switch (option.action) {
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

          case "zoomIn":
            zoom += 0.1 / cameraState.precision;
            break;
          case "zoomOut":
            zoom += -0.1 / cameraState.precision;
            break;
          default:
            break;
        }

        setCameraState({ ...cameraState, x: x, y: y, zoom: zoom });
      }
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

  const PrivacyOnCard = () => {
    return (
      <div className="flex h-[calc(90vh-1.5rem)] flex-col items-center justify-center px-2">
        <CareIcon className="care-l-lock text-center text-9xl text-gray-500 " />
        <div className="text-md font-semibold">
          Feed is unavailable due to privacy mode
        </div>
      </div>
    );
  };

  if (privacy && privacyLockedBy !== authUser.username) {
    return <PrivacyOnCard />;
  }

  //   if (isLoading) return <Loading />;
  if (getConsultationLoading) return <Loading />;

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
                      setCameraOccupier({});
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
                    onError: async (resp) => {
                      if (resp.status === 409) {
                        setCameraOccupier(resp.data as cameraOccupier);
                        Notification.Error({
                          msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
                        });
                      } else {
                        setCameraOccupier({});
                      }
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
                  getCameraStatus({
                    onSuccess: () => {
                      setCameraOccupier({});
                    },
                    onError: (resp) => {
                      if (resp.status === 409) {
                        setCameraOccupier(resp.data as cameraOccupier);
                        Notification.Error({
                          msg: `Camera is being used by ${cameraOccupier?.firstName} ${cameraOccupier?.lastName}`,
                        });
                      } else {
                        setCameraOccupier({});
                      }
                    },
                  });
                }}
                className={classNames(
                  "block border border-gray-500 px-4 py-2 first:rounded-l last:rounded-r",
                  currentPreset === preset
                    ? "border-primary-500 bg-primary-500 text-white"
                    : "bg-transparent"
                )}
              >
                {preset.meta.preset_name || `Preset ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-row gap-2">
          {cameraOccupier?.username && currentCameraOccupierInfo()}
          {subscriptionInfo()}
        </div>
      </div>
      <div
        className={`${
          borderAlert == null ? "" : borderAlert
        }-border-flash mt-2`}
      >
        <div
          className="relative z-0 flex h-[calc(100vh-1.5rem-90px)] grow-0 items-center justify-center overflow-hidden rounded-xl bg-black"
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
                setStreamStatus(StreamStatus.Playing);
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
                setStreamStatus(StreamStatus.Playing);
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
                  STATUS: <span className="text-red-600">OFFLINE</span>
                </p>
                <p className="font-semibold ">Feed is currently not live.</p>
                <p className="font-semibold ">Trying to connect... </p>
                <p className="mt-2 flex justify-center">
                  <Spinner circle={{ fill: "none" }} />
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
          {streamStatus === StreamStatus.Playing &&
            calculateVideoLiveDelay() > 3 && (
              <div className="absolute left-8 top-8 z-10 flex items-center gap-2 rounded-3xl bg-red-400 px-3 py-1.5 text-xs font-semibold text-gray-100">
                <CareIcon className="care-l-wifi-slash h-4 w-4" />
                <span>Slow Network Detected</span>
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
                        userId: authUser?.id,
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
