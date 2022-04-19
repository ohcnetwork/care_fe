import { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import screenfull from "screenfull";
import loadable from "@loadable/component";
import { listAssetBeds } from "../../../Redux/actions";
import RefreshIcon from "@material-ui/icons/Refresh";
import { getCameraPTZ } from "../../../Common/constants";
import {
  StreamStatus,
  useMSEMediaPlayer,
} from "../../../Common/hooks/useMSEplayer";
import { useFeedPTZ } from "../../../Common/hooks/useFeedPTZ";
const PageTitle = loadable(() => import("../../Common/PageTitle"));

const LiveFeed = (props: any) => {
  const middlewareHostname =
    props.middlewareHostname || "dev_middleware.coronasafe.live";
  const cameraAsset = props.asset;
  const [presets, setPresets] = useState<any>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);
  const [streamStatus, setStreamStatus] = useState<StreamStatus>(
    StreamStatus.Offline
  );
  const [loading, setLoading] = useState<string | undefined>();
  const dispatch: any = useDispatch();
  const liveFeedPlayerRef = useRef<any>(null);

  const videoEl = liveFeedPlayerRef.current as HTMLVideoElement;

  let url = `wss://${middlewareHostname}/stream/${cameraAsset?.accessKey}/channel/0/mse?uuid=${cameraAsset?.accessKey}&channel=0`;

  const { startStream } = useMSEMediaPlayer({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
    url,
    videoEl,
  });

  const {
    absoluteMove,

    getPTZPayload,
    getPresets,
    gotoPreset,
    relativeMove,
  } = useFeedPTZ({
    config: {
      middlewareHostname,
      ...cameraAsset,
    },
  });

  const getBedPresets = async (id: any) => {
    const bedAssets = await dispatch(listAssetBeds({ asset: id }));
    setBedPresets(bedAssets?.data?.results);
  };

  const gotoBedPreset = (preset: any) => {
    setLoading("Moving");
    absoluteMove(preset.meta.position, {
      onSuccess: () => setLoading(undefined),
    });
  };
  useEffect(() => {
    getPresets({ onSuccess: (resp) => setPresets(resp.data) });
    getBedPresets(cameraAsset.id);
    if (bedPresets?.[0]?.position) {
      absoluteMove(bedPresets[0]?.position, {});
    }
  }, [cameraAsset.id]);

  const viewOptions = presets
    ? Object.entries(presets)
        .map(([key, value]) => ({ label: key, value }))
        .slice(0, 10)
    : Array.from(Array(10), (_, i) => ({
        label: "Monitor " + (i + 1),
        value: i + 1,
      }));

  const cameraPTZ = getCameraPTZ(precision);

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

  return (
    <div className="mt-4 px-6 mb-20">
      <PageTitle title="Live Feed" hideBack={true} />

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
            <div className="flex max-w-lg mt-4">
              {cameraPTZ.map((option: any) => (
                <button
                  className="bg-green-100 hover:bg-green-200 border border-green-100 p-2 flex-1"
                  key={option.action}
                  onClick={(_) => {
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
                    } else {
                      setLoading(option.loadingLabel);
                      relativeMove(getPTZPayload(option.action), {
                        onSuccess: () => setLoading(undefined),
                      });
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

          <div className="flex flex-col mx-4 max-w-sm">
            <nav className="flex w-full">
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
              <div className="grid grid-cols-2 my-auto gap-2">
                {showDefaultPresets
                  ? viewOptions?.map((option: any, i) => (
                      <button
                        key={i}
                        className="flex flex-wrap gap-2 w-full max- bg-green-100 border border-white rounded-md p-3 text-black  hover:bg-green-500 hover:text-white truncate"
                        onClick={() => {
                          setLoading(`Moving to Preset ${option.label}`);
                          gotoPreset(
                            { preset: option.value },
                            { onSuccess: () => setLoading(undefined) }
                          );
                        }}
                      >
                        {option.label}
                      </button>
                    ))
                  : bedPresets?.map((preset: any, index: number) => (
                      <button
                        key={preset.id}
                        className="flex gap-2 w-52 bg-green-100 border border-white rounded-md p-3 text-black  hover:bg-green-500 hover:text-white truncate"
                        onClick={() => {
                          setLoading("Moving");
                          gotoBedPreset(preset);
                        }}
                      >
                        <span className="justify-start font-semibold">
                          {preset.bed_object.name}
                        </span>
                        <span className="mx-auto">
                          {preset.meta.preset_name
                            ? preset.meta.preset_name
                            : `Unnamed Preset ${index + 1}`}
                        </span>
                      </button>
                    ))}
              </div>
              {props?.showRefreshButton && (
                <button
                  className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:text-white hover:bg-green-500 w-full"
                  onClick={() => {
                    getBedPresets(cameraAsset?.id);
                    getPresets({});
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
