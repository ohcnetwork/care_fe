import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import loadable from "@loadable/component";
const PageTitle = loadable(() => import("../../Common/PageTitle"));

const LiveFeed = (props: any) => {
  const asset = props.asset ?? {
    hostname: "192.168.1.64",
    port: "80",
    username: "onvif_user",
    password: "qwerty123",
  };
  const [sourceUrl, setSourceUrl] = useState<string>();
  const [position, setPosition] = useState<any>();
  const [presets, setPresets] = useState<any>([]);
  const requestStream = () => {
    axios
      .post(`https://dev_middleware.coronasafe.live/start`, {
        uri: "rtsp://remote:qwerty123@192.168.1.64:554/",
      })
      .then((resp: any) => {
        setSourceUrl(`https://dev_middleware.coronasafe.live${resp.data.uri}`);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const stopStream = (url: string | undefined) => {
    if (url) {
      let urlSegments = url.split("/");
      const x = urlSegments.pop();
      const id = urlSegments?.pop();
      axios
        .post(`https://dev_middleware.coronasafe.live/stop`, {
          id,
        })
        .then((resp: any) => {
          console.log(resp);
          // setSourceUrl(`https://dev_middleware.coronasafe.live${resp.data.uri}`);
        })
        .catch((ex: any) => {
          // console.error('Error while refreshing',ex);
        });
    }
  };
  const getCameraStatus = (asset: any) => {
    axios
      .get(
        `https://dev_middleware.coronasafe.live/status?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
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
        `https://dev_middleware.coronasafe.live/presets?hostname=${asset.hostname}&port=${asset.port}&username=${asset.username}&password=${asset.password}`
      )
      .then((resp: any) => {
        setPresets(resp.data);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  const gotoPreset = (preset: number) => {
    axios
      .post(`https://dev_middleware.coronasafe.live/gotoPreset`, {
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
    if (!position) {
      getCameraStatus(asset);
    } else {
      let data = {
        x: 0,
        y: 0,
        zoom: 0,
      } as any;
      // Relative X Y Coordinates
      switch (action) {
        case "up":
          data.y = 0.1;
          break;
        case "down":
          data.y = -0.1;
          break;
        case "left":
          data.x = -0.1;
          break;
        case "right":
          data.x = 0.1;
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
        default:
          break;
      }
      axios
        .post(`https://dev_middleware.coronasafe.live/relativeMove`, {
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

  useEffect(() => {
    requestStream();
  }, []);

  useEffect(() => {
    getPresets(asset);
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
    { icon: "fa fa-search-plus", label: "Zoom In", action: "zoomIn" },
    { icon: "fa fa-search-minus", label: "Zoom Out", action: "zoomOut" },
    { icon: "fa fa-stop", label: "Stop", action: "stop" },
    { icon: "fa fa-undo", label: "Reset", action: "reset" },
  ];

  return (
    <div className="mt-4 px-6 mb-20">
      <PageTitle title="Live Feed" hideBack={true} />
      <div className="mt-4 flex flex-col">
        <div className="mt-4 flex flex-col md:flex-row">
          {sourceUrl ? (
            <ReactPlayer
              url={sourceUrl}
              ref={liveFeedPlayerRef}
              playing={true}
              muted={true}
              onError={(_) => {
                // requestStream();
                console.log("Video Player Error");
              }}
            />
          ) : (
            <div className="w-full max-w-xl bg-gray-500 flex flex-col justify-center items-center">
              <p className="font-bold text-black">
                STATUS: <span className="text-red-600">OFFLINE</span>
              </p>
              <p className="font-semibold text-black">
                Feed is currently not live
              </p>
            </div>
          )}
          <div className="grid grid-cols-2 md:ml-12 my-auto gap-4 mt-4 md:mt-0">
            {viewOptions.map((option: any) => (
              <div onClick={() => gotoPreset(option.value)}>
                <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                  {option.label}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row justify-between">
          <div className="mt-5 p-2 flex flex-row bg-green-100 border border-white rounded w-9/12 md:w-5/12 justify-evenly">
            {cameraPTZ.map((option: any) => (
              <div
                key={option.action}
                onClick={(_) => {
                  console.log(option.action);
                  requestPTZ(option.action);
                }}
              >
                <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                  <span className="sr-only">{option.label}</span>
                  <i className={`${option.icon} md:p-2`}></i>
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col justify-center mt-5 mr-4 md:mt-auto md:mr-0">
            <button onClick={handleClickFullscreen}>
              <i className="fas fa-expand hover:text-black"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveFeed;
