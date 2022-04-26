import clsx from "clsx";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import screenfull from "screenfull";
import { getCameraPTZ } from "../../../Common/constants";
import { PTZ, useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
import {
  ICameraAssetState,
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import {
  getConsultation,
  listAssetBeds,
  partialUpdateAssetBed,
} from "../../../Redux/actions";
import Loading from "../../Common/Loading";
import PageTitle from "../../Common/PageTitle";
import { ConsultationModel } from "../models";

interface IFeedProps {
  facilityId: string;
  patientId: string;
  consultationId: any;
}

const PATIENT_DEFAULT_PRESET = "Patient View".trim().toLowerCase();

export const Feed: React.FC<IFeedProps> = ({ consultationId }) => {
  const dispatch: any = useDispatch();
  const [cameraAsset, setCameraAsset] = useState<ICameraAssetState>({
    hostname: "",
    id: "",
    password: "",
    port: 123,
    username: "",
    accessKey: "",
  });
  const [cameraMiddlewareHostname, setCameraMiddlewareHostname] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [cameraConfig, setCameraConfig] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [bed, setBed] = useState<any>();
  const [precision, setPrecision] = useState(1);

  const liveFeedPlayerRef = useRef<HTMLVideoElement | null>(null);
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultation(consultationId));
      const consultation = res.data as ConsultationModel;
      if (!status.aborted) {
        if (consultation?.current_bed?.bed_object?.id) {
          let bedAssets = await dispatch(
            listAssetBeds({ bed: consultation?.current_bed?.bed_object?.id })
          );
          setBed(consultation?.current_bed?.bed_object?.id);
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
          console.log("Found " + bedAssets.data.results.length + "bedAssets:");
          if (bedAssets?.data?.results?.length) {
            const { camera_address, camera_access_key, middleware_hostname } =
              bedAssets.data.results[0].asset_object.meta;
            const config = camera_access_key.split(":");
            setCameraAsset({
              id: bedAssets.data.results[0].asset_object.id,
              hostname: camera_address,
              username: config[0] || "",
              password: config[1] || "",
              port: 80,
              accessKey: config[2] || "",
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

  // const [position, setPosition] = useState<any>();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [presets, setPresets] = useState<any>([]);
  const [currentPreset, setCurrentPreset] = useState<any>();
  // const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);

  const [loading, setLoading] = useState<string | undefined>(undefined);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );

  const url = `wss://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`;
  const {
    startStream,
    // setVideoEl,
  } = useMSEMediaPlayer({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    url,
    videoEl: liveFeedPlayerRef.current,
  });

  const {
    absoluteMove,
    getCameraStatus,
    getPTZPayload,
    getPresets,
    relativeMove,
  } = useFeedPTZ({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
  });

  const getBedPresets = async (asset: any) => {
    if (asset.id && bed) {
      const bedAssets = await dispatch(listAssetBeds({ asset: asset.id, bed }));
      setBedPresets(bedAssets?.data?.results);
    }
  };

  useEffect(() => {
    if (cameraAsset.hostname) {
      getPresets({ onSuccess: (resp) => setPresets(resp.data) });
      getBedPresets(cameraAsset);
    }
  }, [cameraAsset]);

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
      setLoading("Moving");
      const preset = bedPresets?.find(
        (preset: any) =>
          String(preset?.meta?.preset_name).trim().toLowerCase() ===
          PATIENT_DEFAULT_PRESET
      );
      absoluteMove(preset?.meta?.position, {
        onSuccess: () => {
          setLoading(undefined);
          setCurrentPreset(preset);
        },
      });
    }
  }, [bedPresets, streamStatus]);

  if (isLoading) {
    return <Loading />;
  }

  const cameraPTZ = getCameraPTZ(precision);

  return (
    <div
      className="px-2 flex flex-col gap-4 overflow-hidden w-full"
      style={{ height: "90vh", maxHeight: "860px" }}
    >
      <div className="flex items-center flex-wrap justify-between gap-2">
        <PageTitle
          title={
            "Patient Details -  Camera Feed" +
            " " +
            bedPresets?.[0]?.asset_object?.name
          }
          breadcrumbs={false}
        />
        <div className="flex items-center gap-4 px-3">
          <p className="block text-lg font-medium"> Camera Presets :</p>
          <div className="flex items-center">
            {bedPresets?.map((preset: any, index: number) => (
              <button
                key={preset.id}
                onClick={() => {
                  setLoading("Moving");
                  // gotoBedPreset(preset);
                  absoluteMove(preset.meta.position, {
                    onSuccess: () => {
                      setLoading(undefined);
                      setCurrentPreset(preset);
                    },
                  });
                  getCameraStatus({});
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
            <video
              id="mse-video"
              autoPlay
              muted
              playsInline
              className="h-full w-full z-10"
              ref={liveFeedPlayerRef}
            ></video>
            {loading && (
              <div className="absolute right-0 top-0 p-4 bg-white bg-opacity-75 rounded-bl">
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
          <div className="mt-8 lg:mt-0 flex-shrink-0 flex lg:flex-col items-stretch">
            {cameraPTZ.map((option) => (
              <button
                key={option.action}
                className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2"
                onClick={() => {
                  if (option.action === "precision") {
                    setPrecision((precision) =>
                      precision === 16 ? 1 : precision * 2
                    );
                  } else if (option.action === "reset") {
                    setStreamStatus(StreamStatus.Loading);
                    startStream({
                      onSuccess: () => setStreamStatus(StreamStatus.Playing),
                      onError: () => setStreamStatus(StreamStatus.Offline),
                    });
                  } else if (option.action === "stop") {
                    // NEED ID TO STOP STREAM
                  } else if (option.action === "fullScreen") {
                    if (screenfull.isEnabled && liveFeedPlayerRef.current) {
                      screenfull.request(liveFeedPlayerRef.current);
                    }
                  } else if (option.action === "updatePreset") {
                    getCameraStatus({
                      onSuccess: async ({ data }: any) => {
                        console.log({ currentPreset, data });
                        if (currentPreset?.asset_object?.id && data?.position) {
                          setLoading(option.loadingLabel);
                          const response = await dispatch(
                            partialUpdateAssetBed(
                              { meta: { ...data?.position } },
                              currentPreset?.id
                            )
                          );
                          console.log(response);
                          setLoading(undefined);
                        }
                      },
                    });
                  } else {
                    setLoading(option.loadingLabel);
                    relativeMove(
                      getPTZPayload(option.action as PTZ, precision),
                      {
                        onSuccess: () => setLoading(undefined),
                      }
                    );
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
