import axios from "axios";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useDispatch } from "react-redux";
import screenfull from "screenfull";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import {
  getConsultation,
  getDailyReport,
  listAssetBeds,
} from "../../../Redux/actions";
import Loading from "../../Common/Loading";
import PageTitle from "../../Common/PageTitle";

interface IFeedProps {
  facilityId: string;
  patientId: string;
  consultationId: any;
}

interface ICameraAssetState {
  id: string;
  username: string;
  password: string;
  hostname: string;
  port: number;
}

export const Feed: React.FC<IFeedProps> = ({
  consultationId,
  facilityId,
  patientId,
  ...props
}) => {
  const dispatch: any = useDispatch();
  const [cameraAsset, setCameraAsset] = useState<Partial<ICameraAssetState>>(
    {}
  );
  const [cameraMiddlewareHostname, setCameraMiddlewareHostname] = useState({});
  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [precision, setPrecision] = useState(1);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const [res, dailyRounds] = await Promise.all([
        dispatch(getConsultation(consultationId)),
        dispatch(getDailyReport({ limit: 1, offset: 0 }, { consultationId })),
      ]);
      if (!status.aborted) {
        if (dailyRounds?.data?.results?.length) {
          const bedAssets = await dispatch(
            listAssetBeds({ bed: dailyRounds.data.results[0].bed })
          );
          if (bedAssets?.data?.results?.length) {
            const { camera_address, camera_access_key, middleware_hostname } =
              bedAssets.data.results[0].asset_object.meta;
            setCameraAsset({
              id: bedAssets.data.results[0].asset_object.id,
              hostname: camera_address,
              username: camera_access_key.split(":")[0],
              password: camera_access_key.split(":")[1],
              port: 80,
            });
            setCameraMiddlewareHostname(middleware_hostname);
            setCameraConfig(bedAssets.data.results[0].meta);
          }
        }

        setIsLoading(false);
      }
    },
    [consultationId, dispatch]
  );

  const middlewareHostname =
    cameraMiddlewareHostname || "dev_middleware.coronasafe.live";

  const [sourceUrl, setSourceUrl] = useState<string>();
  const [position, setPosition] = useState<any>();
  const [presets, setPresets] = useState<any>([]);
  const [currentPreset, setCurrentPreset] = useState<any>();
  // const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let loadingTimeout: any;
    if (loading === true)
      loadingTimeout = setTimeout(() => {
        setLoading(false);
      }, 6000);
    return () => {
      if (loadingTimeout) clearTimeout(loadingTimeout);
    };
  }, [loading]);
  const requestStream = () => {
    axios
      .post(`https://${middlewareHostname}/start`, {
        uri: `rtsp://${cameraAsset.username}:${cameraAsset.password}@${cameraAsset.hostname}:554/`,
      })
      .then((resp: any) => {
        setSourceUrl(`https://${middlewareHostname}${resp.data.uri}`);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const stopStream = (url: string | undefined) => {
    console.log("stop", url);
    if (url) {
      let urlSegments = url.split("/");
      const x = urlSegments.pop();
      const id = urlSegments?.pop();
      axios
        .post(`https://${middlewareHostname}/stop`, {
          id,
        })
        .then((resp: any) => {
          console.log(resp);
          // setSourceUrl(`https://${middlewareHostname}${resp.data.uri}`);
        })
        .catch((ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    }
  };
  const getCameraStatus = useCallback(
    (asset: any) => {
      axios
        .get(
          `https://${middlewareHostname}/status?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
        )
        .then((resp: any) => {
          setPosition(resp.data.position);
        })
        .catch((ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    },
    [middlewareHostname]
  );
  const getPresets = (asset: any) => {
    axios
      .get(
        `https://${middlewareHostname}/presets?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
      )
      .then((resp: any) => {
        setPresets(resp.data);
        console.log("PRESETS", resp.data);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const getBedPresets = async (asset: any) => {
    const bedAssets = await dispatch(listAssetBeds({ asset: asset.id }));
    setBedPresets(bedAssets?.data?.results);
  };
  const gotoBedPreset = (preset: any) => {
    absoluteMove(preset.meta.position);
  };
  const gotoPreset = (preset: number) => {
    axios
      .post(`https://${middlewareHostname}/gotoPreset`, {
        ...cameraAsset,
        preset,
      })
      .then((resp: any) => {
        console.log(resp.data);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const requestPTZ = (action: string) => {
    setLoading(true);
    if (!position) {
      getCameraStatus(cameraAsset);
    } else {
      let data = {
        x: 0,
        y: 0,
        zoom: 0,
      } as any;
      console.log(action);
      const delta = 0.1 / precision;
      console.log("delta", delta);
      // Relative X Y Coordinates
      switch (action) {
        case "up":
          data.y = delta;
          break;
        case "down":
          data.y = -delta;
          break;
        case "left":
          data.x = -delta;
          break;
        case "right":
          data.x = delta;
          break;
        case "precision":
          setPrecision((precision) => (precision === 16 ? 1 : precision * 2));
          break;
        case "zoomIn":
          data.zoom = 0.1;
          break;
        case "zoomOut":
          data.zoom = -0.1;
          break;
        case "stop":
          stopStream(sourceUrl);
          setSourceUrl(undefined);
          return;
        case "reset":
          setSourceUrl(undefined);
          requestStream();
          return;
        case "fullScreen":
          if (screenfull?.isEnabled) {
            if (liveFeedPlayerRef?.current) {
              screenfull.request(liveFeedPlayerRef.current.wrapper);
            }
          }
          return;
        default:
          break;
      }
      axios
        .post(`https://${middlewareHostname}/relativeMove`, {
          ...data,
          ...cameraAsset,
        })
        .then((resp: any) => {
          console.log(resp.data);
          getCameraStatus(cameraAsset);
        })
        .catch((ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    }
  };

  const absoluteMove = (data: any) => {
    setLoading(true);
    axios
      .post(`https://${middlewareHostname}/absoluteMove`, {
        ...data,
        ...cameraAsset,
      })
      .then((resp: any) => {
        getCameraStatus(cameraAsset);
      })
      .catch((ex: any) => {
        console.error("Error while absolute move", ex);
      });
  };

  useEffect(() => {
    requestStream();
  }, []);

  useEffect(() => {
    getPresets(cameraAsset);
    getBedPresets(cameraAsset);
    if (cameraConfig?.position) {
      absoluteMove(cameraConfig.position);
    }
  }, [cameraAsset]);

  const liveFeedPlayerRef = useRef<any>(null);

  const viewOptions = presets
    ? Object.entries(presets)
        .map(([key, value]) => ({ label: key, value }))
        .slice(0, 10)
    : Array.from(Array(10), (_, i) => ({
        label: "Monitor " + (i + 1),
        value: i + 1,
      }));

  const cameraPTZ = [
    { icon: "fa fa-arrow-up", label: "Up", action: "up" },
    { icon: "fa fa-arrow-down", label: "Down", action: "down" },
    { icon: "fa fa-arrow-left", label: "Left", action: "left" },
    { icon: "fa fa-arrow-right", label: "Right", action: "right" },
    { value: precision, label: "Precision", action: "precision" },
    { icon: "fa fa-search-plus", label: "Zoom In", action: "zoomIn" },
    { icon: "fa fa-search-minus", label: "Zoom Out", action: "zoomOut" },
    { icon: "fa fa-stop", label: "Stop", action: "stop" },
    { icon: "fa fa-undo", label: "Reset", action: "reset" },
    { icon: "fas fa-expand", label: "Full Screen", action: "fullScreen" },
  ];

  useAbortableEffect((status: statusType) => {
    fetchData(status);
  }, []);
  useEffect(() => {
    getCameraStatus(cameraAsset);
  }, [cameraAsset, getCameraStatus]);

  useEffect(() => {
    requestStream();
  }, [requestStream]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="p-2">
      <div className="flex items-center flex-wrap justify-between gap-2">
        <PageTitle title="Patient Details -  Camera Feed" breadcrumbs={false} />
        <div className="flex items-center gap-4 px-3">
          <p className="block text-lg font-medium"> Camera Presets :</p>
          <div className="flex items-center">
            {bedPresets?.map((preset: any, index: number) => (
              <button
                key={preset.id}
                onClick={(_) => {
                  setLoading(true);
                  gotoBedPreset(preset);
                  getCameraStatus(cameraAsset);
                  setCurrentPreset(preset);
                }}
                className={clsx(
                  "px-4 py-2 border border-gray-500 block",
                  currentPreset === preset
                    ? "bg-primary-500 border-primary-500 text-white rounded"
                    : "bg-transparent"
                )}
              >
                {preset.meta.preset_name || `Preset ${index + 1}`}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="px-3 mt-4">
        <div className="lg:flex items-start gap-8">
          <div className="mb-4 lg:mb-0 relative feed-aspect-ratio w-full bg-primary-100 rounded">
            {sourceUrl ? (
              <ReactPlayer
                url={sourceUrl}
                ref={liveFeedPlayerRef}
                playing={true}
                muted={true}
                onError={(
                  e: any,
                  data: any,
                  hlsInstance: any,
                  hlsGlobal: any
                ) => {
                  // requestStream();
                  console.log("Error", e);
                  console.log("Data", data);
                  console.log("HLS Instance", hlsInstance);
                  console.log("HLS Global", hlsGlobal);
                  if (e === "hlsError") {
                    const recovered = hlsInstance.recoverMediaError();
                    console.log(recovered);
                  }
                }}
                width="100%"
                height="100%"
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div className="w-full h-full flex flex-col justify-center items-center">
                <p className="font-bold text-black">
                  STATUS: <span className="text-red-600">OFFLINE</span>
                </p>
                <p className="font-semibold text-black">
                  Feed is currently not live
                </p>
              </div>
            )}
            {loading && (
              <div className="absolute right-0 bottom-0 p-4 bg-white bg-opacity-75 rounded-tl">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-b-0 border-primary-500 rounded-full animate-spin an" />
                  <p className="text-base font-bold">Moving</p>
                </div>
              </div>
            )}
          </div>
          <div className="lg:flex flex-col bg-green-100 ">
            {cameraPTZ.map((option: any) => (
              <button
                className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2"
                key={option.action}
                onClick={(_) => {
                  requestPTZ(option.action);
                }}
              >
                <span className="sr-only">{option.label}</span>
                {option.icon ? (
                  <i className={`${option.icon} md:p-2`}></i>
                ) : (
                  <span className="px-2 font-bold h-full w-8 flex items-center justify-center">
                    {option.value}x
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
