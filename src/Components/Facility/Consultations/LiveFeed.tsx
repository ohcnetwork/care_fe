import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import ReactPlayer from "react-player";
import screenfull from "screenfull";
import loadable from "@loadable/component";
const PageTitle = loadable(() => import("../../Common/PageTitle"));

const LiveFeed = () => {
  const [sourceUrl, setSourceUrl] = useState<string>();
  const requestStream = () => {
    axios
      .post(`https://testcamera0001.in.ngrok.io/start`, {
        uri: "rtsp://remote:qwerty123@192.168.1.64:554/",
      })
      .then((resp: any) => {
        setSourceUrl(`https://testcamera0001.in.ngrok.io${resp.data.uri}`);
      })
      .catch((ex: any) => {
        // console.error('Error while refreshing',ex);
      });
  };
  useEffect(() => {
    requestStream();
  }, []);

  const liveFeedPlayerRef = useRef<any>(null);
  const handleClickFullscreen = () => {
    if (screenfull.isEnabled) {
      if (liveFeedPlayerRef.current) {
        screenfull.request(liveFeedPlayerRef.current.wrapper);
      }
    }
  };

  const viewOptions = [
    "Patient Head",
    "Monitor 0",
    "Upper Body",
    "Monitor 1",
    "Lower Body",
    "Monitor 2",
    "Monitor 4",
    "Monitor 5",
    "Preset 1",
    "Preset 2",
    "Preset 3",
    "Preset 4",
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
                requestStream();
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
              <div>
                <button className="bg-green-100 border border-white rounded-md px-3 py-2 text-black font-semibold hover:bg-green-200 w-full">
                  {option}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-row justify-between">
          <div className="mt-5 p-2 flex flex-row bg-green-100 border border-white rounded w-9/12 md:w-5/12 justify-evenly">
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-arrow-up md:p-2"></i>
              </button>
            </div>
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-arrow-down md:p-2"></i>
              </button>
            </div>
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-arrow-left md:p-2"></i>
              </button>
            </div>
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-arrow-right md:p-2"></i>
              </button>
            </div>
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-search-plus md:p-2"></i>
              </button>
            </div>
            <div>
              <button className="bg-green-100 hover:bg-green-200 border border-green-100 rounded p-2">
                <i className="fas fa-redo md:p-2"></i>
              </button>
            </div>
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
