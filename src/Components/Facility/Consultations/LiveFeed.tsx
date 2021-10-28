import axios from "axios";
import React, { useEffect, useState } from "react";
import ReactPlayer from "react-player";

export default function LiveFeed() {
  const [sourceUrl, setSourceUrl] = useState<string>();
  const requestStream = async () => {
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

  return (
    <div>
      {sourceUrl && (
        <ReactPlayer
          url={sourceUrl}
          playing={true}
          muted={true}
          onError={(_) => {
            requestStream();
            console.log("Video Player Error");
          }}
        />
      )}
    </div>
  );
}
