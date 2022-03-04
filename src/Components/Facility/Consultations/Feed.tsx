import axios from "axios";
import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import ReactPlayer from "react-player";
import { useDispatch } from "react-redux";
import screenfull from "screenfull";
import { useMSEMediaPlayer } from "../../../Common/hooks/useMSEplayer";
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
  const [cameraAsset, setCameraAsset] = useState<ICameraAssetState>({
    hostname: "",
    id: "",
    password: "",
    port: 123,
    username: "",
  });
  const [cameraMiddlewareHostname, setCameraMiddlewareHostname] = useState("");
  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [precision, setPrecision] = useState(1);

  const liveFeedPlayerRef = useRef<HTMLVideoElement | null>(null);
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

  const getBedPresets = async (asset: any) => {
    const bedAssets = await dispatch(listAssetBeds({ asset: asset.id }));
    setBedPresets(bedAssets?.data?.results);
  };

  let url = `ws://demo:demo@localhost:8084/stream/demo/channel/0/mse?uuid=demo&channel=0`;
  const {
    absoluteMove,
    getCameraStatus,
    getPTZPayload,
    getPresets,
    gotoPreset,
    relativeMove,
    startStream,
    stopStream,
    // setVideoEl,
  } = useMSEMediaPlayer({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    url,
    videoEl: liveFeedPlayerRef.current,
  });

  useEffect(() => {
    getPresets({ onSuccess: (resp) => setPresets(resp.data) });
    getBedPresets(cameraAsset);
    if (bedPresets?.[0]?.position) {
      absoluteMove(bedPresets[0]?.position, {});
    }
  }, [cameraAsset]);

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

  if (isLoading) {
    return <Loading />;
  }

  const gotoBedPreset = (preset: any) => {
    absoluteMove(preset.meta.position, {});
  };

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
                  getCameraStatus({});
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
            {true ? (
              <video
                id="mse-video"
                autoPlay
                muted
                playsInline
                className="h-full w-full"
                ref={liveFeedPlayerRef}
              ></video>
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
                  if (option.action === "precision") {
                    setPrecision((precision) =>
                      precision === 16 ? 1 : precision * 2
                    );
                  } else if (option.action === "reset") {
                    startStream();
                  } else if (option.action === "stop") {
                    // NEED ID TO STOP STREAM
                  } else if (option.action === "fullScreen") {
                    if (screenfull.isEnabled && liveFeedPlayerRef.current) {
                      screenfull.request(liveFeedPlayerRef.current);
                    }
                  } else {
                    relativeMove(getPTZPayload(option.action), {});
                  }
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
