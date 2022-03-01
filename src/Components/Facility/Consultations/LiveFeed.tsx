import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch } from "react-redux";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import loadable from "@loadable/component";
import { listAssetBeds } from "../../../Redux/actions";
import RefreshIcon from "@material-ui/icons/Refresh";
const PageTitle = loadable(() => import("../../Common/PageTitle"));

const LiveFeed = (props: any) => {
  const middlewareHostname =
    props.middlewareHostname || "dev_middleware.coronasafe.live";
  const [asset, setAsset] = useState<any>(props.asset);
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [position, setPosition] = useState<any>();
  const [presets, setPresets] = useState<any>([]);
  const [bedPresets, setBedPresets] = useState<any>([]);
  const [showDefaultPresets, setShowDefaultPresets] = useState<boolean>(false);
  const [precision, setPrecision] = useState(1);

  const [loading, setLoading] = useState<boolean>(false);
  const dispatch: any = useDispatch();
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
        uri: `rtsp://${asset.username}:${asset.password}@${asset.hostname}:554/`,
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
  const getCameraStatus = (asset: any) => {
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
  };
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
    setBedPresets(bedAssets.data.results);
  };
  const gotoBedPreset = (preset: any) => {
    absoluteMove(preset.meta.position);
  };
  const gotoPreset = (preset: number) => {
    axios
      .post(`https://${middlewareHostname}/gotoPreset`, {
        ...asset,
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
      getCameraStatus(asset);
    } else {
      let data = {
        x: 0,
        y: 0,
        zoom: 0,
      } as any;
      console.log("Relative Move");
      console.log(position);
      const delta = 0.01 / position.zoom;
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
        case "zoomIn":
          data.zoom = 0.1;
          break;
        case "zoomOut":
          data.zoom = -0.1;
          break;
        case "precision":
          setPrecision((precision) => (precision === 16 ? 1 : precision * 2));
          break;
        case "stop":
          stopStream(sourceUrl);
          setSourceUrl(undefined);
          return;
        case "reset":
          setSourceUrl(undefined);
          requestStream();
          return;
        default:
          break;
      }
      axios
        .post(`https://${middlewareHostname}/relativeMove`, {
          ...data,
          ...asset,
        })
        .then((resp: any) => {
          console.log(resp.data);
          getCameraStatus(asset);
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
        ...asset,
      })
      .then((resp: any) => {
        getCameraStatus(asset);
      })
      .catch((ex: any) => {
        console.error("Error while absolute move", ex);
      });
  };

  useEffect(() => {
    requestStream();
  }, []);

  useEffect(() => {
    getPresets(asset);
    getBedPresets(asset);
    if (props.config?.position) {
      absoluteMove(props.config.position);
    }
  }, [asset]);

  const liveFeedPlayerRef = useRef<any>(null);
  const handleClickFullscreen = () => {
    if (screenfull.isEnabled) {
      if (liveFeedPlayerRef.current) {
        screenfull.request(liveFeedPlayerRef.current.wrapper);
      }
    }
  };

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
  ];

  return (
    <div className="mt-4 px-6 mb-20">
      <PageTitle title="Live Feed" hideBack={true} />
      <div className="mt-4 flex flex-col">
        <div className="mt-4 relative flex flex-col md:flex-row">
          <div>
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
              />
            ) : (
              <div
                className="bg-gray-500 flex flex-col justify-center items-center"
                style={{ height: "360px", width: "640px" }}
              >
                <p className="font-bold text-black">
                  STATUS: <span className="text-red-600">OFFLINE</span>
                </p>
                <p className="font-semibold text-black">
                  Feed is currently not live
                </p>
              </div>
            )}
            <div className="flex flex-row justify-between">
              <div className="mt-5 p-2 flex flex-row bg-green-100 border border-white rounded flex-1 justify-evenly">
                {cameraPTZ.map((option: any) => (
                  <div
                    key={option.action}
                    onClick={(_) => {
                      // console.log(option.action);
                      requestPTZ(option.action);
                    }}
                  >
                    <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                      <span className="sr-only">{option.label}</span>
                      {option.icon ? (
                        <i className={`${option.icon} md:p-2`}></i>
                      ) : (
                        <span className="px-2 font-bold h-full w-8 flex items-center justify-center">
                          {option.value}x
                        </span>
                      )}
                    </button>
                  </div>
                ))}
                <button
                  className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2"
                  onClick={handleClickFullscreen}
                >
                  <span className="sr-only">Full Screen</span>
                  <i className="fas fa-expand hover:text-black"></i>
                </button>
              </div>
              {/* <div className="flex flex-col justify-center mt-5 mr-4 md:mt-auto md:mr-0">
                    <button onClick={handleClickFullscreen}>
                    </button>
                  </div> */}
            </div>
          </div>
          <div
            className={
              (loading ? "absolute" : "hidden") +
              " bg-gray-500 bg-opacity-75 z-5 transition-opacity"
            }
            style={{ height: "360px", width: "640px" }}
          >
            {/* div with "Loading" at the center */}
            <div className="flex justify-center items-center h-full">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <div className="text-white text-2xl">Moving Camera</div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:ml-12 md:w-1/3 my-auto gap-4 mt-4 md:mt-0">
            {showDefaultPresets
              ? viewOptions.map((option: any) => (
                  <div
                    onClick={() => {
                      setLoading(true);
                      gotoPreset(option.value);
                    }}
                  >
                    <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                      {option.label}
                    </button>
                  </div>
                ))
              : bedPresets.map((preset: any, index: number) => (
                  <div
                    onClick={() => {
                      setLoading(true);
                      gotoBedPreset(preset);
                    }}
                    key={preset.id}
                  >
                    <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                      {preset.meta.preset_name
                        ? preset.meta.preset_name
                        : `Unnamed Preset ${index + 1}`}
                    </button>
                  </div>
                ))}
            {props.showRefreshButton && (
              <div
                onClick={() => {
                  setLoading(true);
                  getBedPresets(asset);
                  getPresets(asset);
                }}
              >
                <button className="bg-green-200 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-300 w-full">
                  <RefreshIcon /> Refresh
                </button>
              </div>
            )}
            <button
              className="bg-green-200 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-300 w-full"
              onClick={() => {
                setShowDefaultPresets(!showDefaultPresets);
              }}
            >
              {showDefaultPresets
                ? "Show Patient Presets"
                : "Show Default Presets"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
