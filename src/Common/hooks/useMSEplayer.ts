import { useEffect, useRef } from "react";

export interface IAsset {
  middlewareHostname: string;
}

interface UseMSEMediaPlayerOption {
  config: IAsset;
  url?: string;
  videoEl: HTMLVideoElement | null;
}

export interface ICameraAssetState {
  id: string;
  accessKey: string;
  middleware_address: string;
  location_middleware: string;
}

export enum StreamStatus {
  Playing,
  Stop,
  Loading,
  Offline,
}

interface UseMSEMediaPlayerReturnType {
  stopStream: (config: { id: string }, options: IOptions) => void;
  startStream: (options?: IOptions) => void;
}

export interface IOptions {
  onSuccess?: (resp: any) => void;
  onError?: (err: any) => void;
}
const stopStream =
  ({
    middlewareHostname,
    ws,
  }: {
    middlewareHostname: string;
    ws?: WebSocket;
  }) =>
  (payload: { id: string }, options: IOptions) => {
    const { id } = payload;
    ws?.close();
    fetch(`https://${middlewareHostname}/stop`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error("network response was not ok");
        }
        return res.json();
      })
      .then((res) => options?.onSuccess && options.onSuccess(res))
      .catch((err) => options.onError && options.onError(err));
  };

/**
 * MSE player utility
 */
const Utf8ArrayToStr = (array: string | any[] | Uint8Array) => {
  let out, i, c;
  let char2, char3;
  out = "";
  const len = array.length;
  i = 0;
  while (i < len) {
    c = array[i++];
    switch (c >> 4) {
      case 7:
        out += String.fromCharCode(c);
        break;
      case 13:
        char2 = array[i++];
        out += String.fromCharCode(((c & 0x1f) << 6) | (char2 & 0x3f));
        break;
      case 14:
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(
          ((c & 0x0f) << 12) | ((char2 & 0x3f) << 6) | ((char3 & 0x3f) << 0),
        );
        break;
    }
  }
  return out;
};

export const useMSEMediaPlayer = ({
  config,
  url,
  videoEl,
}: UseMSEMediaPlayerOption): UseMSEMediaPlayerReturnType => {
  const mseQueue: any[] = [];
  let mseStreamingStarted = false;
  const wsRef = useRef<WebSocket>();
  let mseSourceBuffer: any;

  const pushPacket = () => {
    if (!mseSourceBuffer.updating) {
      if (mseQueue.length > 0) {
        const packet = mseQueue.shift();
        // Check if SourceBuffer has been removed before appending buffer
        if (mseSourceBuffer.removed) {
          console.error("Attempted to append to a removed SourceBuffer.");
          return;
        }
        mseSourceBuffer.appendBuffer(packet);
      } else {
        mseStreamingStarted = false;
      }
    }
    if (videoEl && videoEl.buffered.length > 0) {
      if (typeof document.hidden !== "undefined" && document.hidden) {
        //no sound, browser paused video without sound in background
        videoEl.currentTime =
          videoEl.buffered.end(videoEl.buffered.length - 1) - 0.5;
      }
    }
  };

  const readPacket = (packet: any) => {
    if (!mseStreamingStarted) {
      // Check if SourceBuffer has been removed before appending buffer
      if (mseSourceBuffer.removed) {
        console.error("Attempted to append to a removed SourceBuffer.");
        return;
      }
      mseSourceBuffer.appendBuffer(packet);
      mseStreamingStarted = true;
      return;
    }
    mseQueue.push(packet);
    if (!mseSourceBuffer.updating) {
      pushPacket();
    }
  };

  const startStream = ({ onError, onSuccess }: IOptions = {}) => {
    // location.protocol == 'https:' ? protocol = 'wss' : protocol = 'ws';
    try {
      wsRef.current?.close();
      const mse = new MediaSource();
      if (videoEl) {
        videoEl.src = window.URL.createObjectURL(mse);
      }

      if (url) {
        mse.addEventListener(
          "sourceopen",
          function () {
            wsRef.current = new WebSocket(url);
            const ws = wsRef.current;
            ws.binaryType = "arraybuffer";
            ws.onopen = function (_event) {
              onSuccess && onSuccess(undefined);
            };
            ws.onmessage = function (event) {
              const data = new Uint8Array(event.data);
              if (+data[0] === 9) {
                const decoded_arr = data.slice(1);
                let mimeCodec;
                if (window.TextDecoder) {
                  mimeCodec = new TextDecoder("utf-8").decode(decoded_arr);
                } else {
                  mimeCodec = Utf8ArrayToStr(decoded_arr);
                }
                try {
                  mseSourceBuffer = mse.addSourceBuffer(
                    `video/mp4; codecs="${mimeCodec}"`,
                  );
                } catch (error) {
                  onError?.(error);
                  return;
                }
                mseSourceBuffer.mode = "segments";
                if (mseQueue.length > 0 && !mseSourceBuffer.updating) {
                  mseSourceBuffer.addEventListener("updateend", pushPacket);
                }
              } else {
                readPacket(event.data);
              }
            };
            ws.onerror = function (event) {
              onError && onError(event);
            };
          },
          false,
        );
      }
    } catch (e) {
      onError && onError(e);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (videoEl) {
      videoEl.addEventListener("loadeddata", () => {
        videoEl.play();
      });

      //fix stalled video in safari
      videoEl.addEventListener("pause", () => {
        if (
          videoEl.currentTime >
          videoEl.buffered.end(videoEl.buffered.length - 1)
        ) {
          videoEl.currentTime =
            videoEl.buffered.end(videoEl.buffered.length - 1) - 0.1;
          videoEl.play();
        }
      });

      videoEl.addEventListener("error", (e) => {
        console.log("video_error", e);
      });
    }
  });

  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    startStream: startStream,
    stopStream: stopStream({ ...config, ws: wsRef.current }),
  };
};
