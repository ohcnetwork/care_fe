// import axios from "axios";
// import React, { useEffect, useState, useRef, useCallback } from "react";
// import * as Notification from "../../Utils/Notifications.js";
// import { useDispatch } from "react-redux";
// import ReactPlayer from "react-player";
// import { getAsset, listAssetBeds } from "../../Redux/actions";
// import { statusType, useAbortableEffect } from "../../Common/utils";
// import { useTranslation } from "react-i18next";
// import useFullscreen from "../../Common/hooks/useFullscreen.js";
// interface LiveFeedTileProps {
//   assetId: string;
// }

// interface CameraPosition {
//   x: number;
//   y: number;
//   zoom: number;
// }

// // string:string dictionary
// interface CameraPreset {
//   [key: string]: string;
// }

// export default function LiveFeedTile(props: LiveFeedTileProps) {
//   const dispatch: any = useDispatch();
//   const { assetId } = props;
//   const [sourceUrl, setSourceUrl] = useState<string>();
//   const [asset, setAsset] = useState<any>();
//   const [presets, setPresets] = useState<CameraPreset[]>([]);
//   const [bedPresets, setBedPresets] = useState<any>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   // const [showControls, setShowControls] = useState<boolean>(false);
//   const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
//   const [position, setPosition] = useState<CameraPosition>({
//     x: 0,
//     y: 0,
//     zoom: 0,
//   });
//   const { t } = useTranslation();
//   const [_isFullscreen, setFullscreen] = useFullscreen();
//   // const [toggle, setToggle] = useState(false);

//   useEffect(() => {
//     let loadingTimeout: any;
//     if (loading === true)
//       loadingTimeout = setTimeout(() => {
//         setLoading(false);
//       }, 6000);
//     return () => {
//       if (loadingTimeout) clearTimeout(loadingTimeout);
//     };
//   }, [loading]);

//   const fetchData = useCallback(
//     async (status: statusType) => {
//       setLoading(true);
//       console.log("fetching asset");
//       const assetData: any = await dispatch(getAsset(assetId));
//       if (!status.aborted) {
//         // setLoading(false);
//         if (!assetData.data)
//           Notification.Error({
//             msg: t("something_went_wrong"),
//           });
//         else {
//           setAsset(assetData.data);
//         }
//       }
//     },
//     [dispatch, assetId]
//   );

//   useAbortableEffect(
//     (status: statusType) => fetchData(status),
//     [dispatch, fetchData]
//   );
//   const requestStream = () => {
//     axios
//       .post(`https://${asset.meta.middleware_hostname}/start`, {
//         uri: "rtsp://remote:qwerty123@192.168.1.64:554/",
//       })
//       .then((resp: any) => {
//         setSourceUrl(
//           `https://${asset.meta.middleware_hostname}${resp.data.uri}`
//         );
//       })
//       .catch((_ex: any) => {
//         // console.error('Error while refreshing',ex);
//       });
//   };
//   const stopStream = (url: string | undefined) => {
//     console.log("stop", url);
//     if (url) {
//       const urlSegments = url.split("/");
//       const id = urlSegments?.pop();
//       axios
//         .post(`https://${asset.meta.middleware_hostname}/stop`, {
//           id,
//         })
//         .then((resp: any) => {
//           console.log(resp);
//           // setSourceUrl(`https://${middlewareHostname}${resp.data.uri}`);
//         })
//         .catch((_ex: any) => {
//           // console.error('Error while refreshing',ex);
//         });
//     }
//   };
//   const getCameraStatus = (asset: any) => {
//     axios
//       .get(
//         `https://${asset.meta.middleware_hostname}/status?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
//       )
//       .then((resp: any) => {
//         setPosition(resp.data.position);
//       })
//       .catch((_ex: any) => {
//         // console.error('Error while refreshing',ex);
//       });
//   };
//   const getPresets = (asset: any) => {
//     const url = `https://${asset.meta.middleware_hostname}/presets?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`;
//     axios
//       .get(url)
//       .then((resp: any) => {
//         setPresets(resp.data);
//       })
//       .catch((_ex: any) => {
//         // console.error("Error while refreshing", ex);
//       });
//   };
//   const getBedPresets = async (_asset: any) => {
//     const bedAssets = await dispatch(listAssetBeds({ asset: props.assetId }));
//     setBedPresets(bedAssets.data.results);
//   };
//   const gotoBedPreset = (preset: any) => {
//     absoluteMove(preset.meta.position);
//   };
//   const gotoPreset = (preset: number) => {
//     axios
//       .post(`https://${asset.meta.middleware_hostname}/gotoPreset`, {
//         ...asset,
//         preset,
//       })
//       .then((resp: any) => {
//         console.log(resp.data);
//       })
//       .catch((_ex: any) => {
//         // console.error('Error while refreshing',ex);
//       });
//   };
//   const requestPTZ = (action: string) => {
//     setLoading(true);
//     if (!position) {
//       getCameraStatus(asset);
//     } else {
//       const data = {
//         x: 0,
//         y: 0,
//         zoom: 0,
//       } as any;
//       console.log(action);
//       // Relative X Y Coordinates
//       switch (action) {
//         case "up":
//           data.y = 0.05;
//           break;
//         case "down":
//           data.y = -0.05;
//           break;
//         case "left":
//           data.x = -0.05;
//           break;
//         case "right":
//           data.x = 0.05;
//           break;
//         case "zoomIn":
//           data.zoom = 0.05;
//           break;
//         case "zoomOut":
//           data.zoom = -0.05;
//           break;
//         case "stop":
//           stopStream(sourceUrl);
//           setSourceUrl(undefined);
//           return;
//         case "reset":
//           setSourceUrl(undefined);
//           requestStream();
//           return;
//         default:
//           break;
//       }
//       axios
//         .post(`https://${asset.meta.middleware_hostname}/relativeMove`, {
//           ...data,
//           ...asset,
//         })
//         .then((resp: any) => {
//           console.log(resp.data);
//           getCameraStatus(asset);
//         })
//         .catch((_ex: any) => {
//           // console.error('Error while refreshing',ex);
//         });
//     }
//   };

//   const absoluteMove = (data: any) => {
//     setLoading(true);
//     axios
//       .post(`https://${asset.meta.middleware_hostname}/absoluteMove`, {
//         ...data,
//         ...asset,
//       })
//       .then((_resp: any) => {
//         getCameraStatus(asset);
//       })
//       .catch((ex: any) => {
//         console.error("Error while absolute move", ex);
//       });
//   };

//   useEffect(() => {
//     if (asset) {
//       getPresets(asset);
//       getBedPresets(asset);
//       requestStream();
//     }
//   }, [asset]);

//   useEffect(() => {
//     if (bedPresets.length > 0) absoluteMove(bedPresets[0].meta.position);
//   }, [bedPresets]);

//   // useEffect(() => {
//   //   const timer = setTimeout(() => {
//   //     setShowControls(toggle);
//   //   }, 300);
//   //   return () => clearTimeout(timer);
//   // }, [toggle]);

//   const liveFeedPlayerRef = useRef<any>(null);
//   const handleClickFullscreen = () => {
//     if (liveFeedPlayerRef.current) {
//       setFullscreen(true, liveFeedPlayerRef.current.wrapper);
//     }
//   };

//   const viewOptions = presets
//     ? Object.entries(presets)
//         .map(([key, value]) => ({ label: key, value }))
//         .slice(0, 10)
//     : Array.from(Array(10), (_, i) => ({
//         label: t("monitor") + (i + 1),
//         value: i + 1,
//       }));

//   const cameraPTZ = [
//     { icon: "fa fa-arrow-up", label: t("up"), action: "up" },
//     { icon: "fa fa-arrow-down", label: t("down"), action: "down" },
//     { icon: "fa fa-arrow-left", label: t("left"), action: "left" },
//     { icon: "fa fa-arrow-right", label: t("right"), action: "right" },
//     { icon: "fa fa-search-plus", label: t("zoom_in"), action: "zoomIn" },
//     { icon: "fa fa-search-minus", label: t("zoom_out"), action: "zoomOut" },
//     { icon: "fa fa-stop", label: t("stop"), action: "stop" },
//     { icon: "fa fa-undo", label: t("reset"), action: "reset" },
//   ];

//   return (
//     <div className="mb-2 mt-4 px-6">
//       <div className="mt-4 flex flex-col">
//         <div className="group relative mt-4 flex flex-col">
//           <div>
//             {sourceUrl ? (
//               <div>
//                 <ReactPlayer
//                   url={sourceUrl}
//                   ref={liveFeedPlayerRef}
//                   playing={true}
//                   muted={true}
//                   onError={(
//                     e: any,
//                     data: any,
//                     hlsInstance: any,
//                     hlsGlobal: any
//                   ) => {
//                     // requestStream();
//                     console.log("Error", e);
//                     console.log("Data", data);
//                     console.log("HLS Instance", hlsInstance);
//                     console.log("HLS Global", hlsGlobal);
//                     if (e === "hlsError") {
//                       const recovered = hlsInstance.recoverMediaError();
//                       console.log(recovered);
//                     }
//                   }}
//                 />
//               </div>
//             ) : (
//               <div className="flex h-[50vw] w-[88vw] flex-col items-center justify-center bg-gray-500 xl:h-[25vw] xl:w-[44vw] 3xl:h-[18vw] 3xl:w-[32vw]">
//                 <p className="font-bold text-black">
//                   STATUS: <span className="text-red-600">OFFLINE</span>
//                 </p>
//                 <p className="font-semibold text-black">
//                   {t("feed_is_currently_not_live")}
//                 </p>
//               </div>
//             )}
//           </div>
//           <div className="invisible absolute h-[50vw] w-[88vw] group-hover:visible xl:h-[25vw] xl:w-[44vw] 3xl:h-[18vw] 3xl:w-[32vw]">
//             <div className="flex h-full items-end justify-center">
//               <div className="flex flex-row justify-between">
//                 <div className="mt-5 flex flex-1 flex-row justify-evenly rounded border border-white bg-green-100 p-2">
//                   {cameraPTZ.map((option: any) => (
//                     <div
//                       key={option.action}
//                       onClick={(_) => {
//                         // console.log(option.action);
//                         requestPTZ(option.action);
//                       }}
//                     >
//                       <button className="rounded border border-green-100 bg-green-100 p-2 hover:bg-green-200">
//                         <span className="sr-only">{option.label}</span>
//                         <i className={`${option.icon} md:p-2`}></i>
//                       </button>
//                     </div>
//                   ))}
//                   <button
//                     className="rounded border border-green-100 bg-green-100 p-2 hover:bg-green-200"
//                     onClick={handleClickFullscreen}
//                   >
//                     <span className="sr-only">{t("full_screen")}</span>
//                     <i className="fas fa-expand hover:text-black"></i>
//                   </button>
//                 </div>
//                 {/* <div className="flex flex-col justify-center mt-5 mr-4 md:mt-auto md:mr-0">
//                     <button onClick={handleClickFullscreen}>
//                     </button>
//                   </div> */}
//               </div>
//             </div>
//           </div>
//           <div
//             className={
//               (loading ? "absolute" : "hidden") +
//               " z-10 h-[50vw] w-[88vw] bg-gray-500 bg-opacity-75 transition-opacity xl:h-[25vw] xl:w-[44vw] 3xl:h-[18vw] 3xl:w-[32vw]"
//             }
//           >
//             {/* div with "Loading" at the center */}
//             <div className="flex h-full items-center justify-center">
//               <svg
//                 className="-ml-1 mr-3 h-5 w-5 animate-spin text-white"
//                 xmlns="http://www.w3.org/2000/svg"
//                 fill="none"
//                 viewBox="0 0 24 24"
//               >
//                 <circle
//                   className="opacity-25"
//                   cx="12"
//                   cy="12"
//                   r="10"
//                   stroke="currentColor"
//                   strokeWidth="4"
//                 ></circle>
//                 <path
//                   className="opacity-75"
//                   fill="currentColor"
//                   d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
//                 ></path>
//               </svg>
//               <div className="text-2xl text-white">{t("moving_camera")}</div>
//             </div>
//           </div>
//         </div>
//         <div className="my-auto mt-4 flex max-w-[86vw] flex-wrap gap-4 xl:max-w-[43vw] 3xl:max-w-[30vw]">
//           <button
//             className="rounded-md border border-white bg-green-200 px-3 py-2 font-semibold text-black hover:bg-green-300"
//             onClick={() => {
//               setShowDefaultPresets(!showDefaultPresets);
//             }}
//           >
//             {showDefaultPresets
//               ? t("show_patient_presets")
//               : t("show_default_presets")}
//           </button>
//           {showDefaultPresets
//             ? viewOptions.map((option: any) => (
//                 <div
//                   onClick={() => {
//                     setLoading(true);
//                     gotoPreset(option.value);
//                   }}
//                 >
//                   <button className="w-full rounded-md border border-white bg-green-100 px-3 py-2 font-semibold text-black hover:bg-green-200">
//                     {option.label}
//                   </button>
//                 </div>
//               ))
//             : bedPresets.map((preset: any, index: number) => (
//                 <div
//                   onClick={() => {
//                     setLoading(true);
//                     gotoBedPreset(preset);
//                   }}
//                   key={preset.id}
//                 >
//                   <button className="w-full rounded-md border border-white bg-green-100 px-3 py-2 font-semibold text-black hover:bg-green-200">
//                     {preset.meta.preset_name
//                       ? preset.meta.preset_name
//                       : `Unnamed Preset ${index + 1}`}
//                   </button>
//                 </div>
//               ))}
//         </div>
//       </div>
//     </div>
//   );
// }

import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import useKeyboardShortcut from "use-keyboard-shortcut";
import {
  listAssetBeds,
  partialUpdateAssetBed,
  deleteAssetBed,
} from "../../Redux/actions";
import { getCameraPTZ } from "../../Common/constants";
import {
  StreamStatus,
  useMSEMediaPlayer,
} from "../../Common/hooks/useMSEplayer";
import { useFeedPTZ } from "../../Common/hooks/useFeedPTZ";
import * as Notification from "../../Utils/Notifications.js";
import { AxiosError } from "axios";
import { BedSelect } from "../Common/BedSelect";
import { BedModel } from "./models";
import useWindowDimensions from "../../Common/hooks/useWindowDimensions";
import CareIcon from "../../CAREUI/icons/CareIcon";
import ConfirmDialog from "../Common/ConfirmDialog";
import { FieldLabel } from "../Form/FormFields/FormField";
import useFullscreen from "../../Common/hooks/useFullscreen";
import { FeedCameraPTZHelpButton } from "./Consultations/Feed";

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
  const [videoStartTime, setVideoStartTime] = useState<Date | null>(null);
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
    <div>
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
            <div className="relative mb-4 aspect-video w-full rounded bg-primary-100 lg:mb-0">
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
    </div>
  );
};

export default LiveFeed;
