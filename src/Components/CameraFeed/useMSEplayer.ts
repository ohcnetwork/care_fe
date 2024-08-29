import { useEffect, useRef } from "react";

declare const ManagedMediaSource: typeof MediaSource;

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

export const useMSEMediaPlayer = ({
  config,
  url,
  videoEl,
}: UseMSEMediaPlayerOption): UseMSEMediaPlayerReturnType => {
  const mseQueue: any[] = [];
  let mseStreamingStarted = false;
  const wsRef = useRef<WebSocket>();
  let mseSourceBuffer: SourceBuffer;

  const pushPacket = () => {
    if (!mseSourceBuffer.updating) {
      if (mseQueue.length > 0) {
        const packet = mseQueue.shift();
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

  function readPacket(event: MessageEvent<any>): any {
    if (!mseStreamingStarted) {
      mseSourceBuffer.appendBuffer(event.data);
      mseStreamingStarted = true;
      return;
    }
    mseQueue.push(event.data);
    if (!mseSourceBuffer.updating) {
      pushPacket();
    }
  }

  const startStream = ({ onError, onSuccess }: IOptions = {}) => {
    try {
      wsRef.current?.close();
      if (!videoEl) return;

      let mse: MediaSource;
      if (typeof ManagedMediaSource !== "undefined") {
        mse = new ManagedMediaSource();
        videoEl.disableRemotePlayback = true;
        videoEl.srcObject = mse;
      } else {
        mse = new MediaSource();
        videoEl.src = URL.createObjectURL(mse);
      }

      if (url) {
        mse.onsourceopen = function () {
          wsRef.current = new WebSocket(url);
          const ws = wsRef.current;
          ws.binaryType = "arraybuffer";
          ws.onopen = (_) => onSuccess && onSuccess(undefined);
          ws.onerror = (event) => onError && onError(event);
          ws.onmessage = function (event) {
            const data = new Uint8Array(event.data);
            if (+data[0] === 9) {
              const mimeCodec = new TextDecoder("utf-8").decode(data.slice(1));
              try {
                //https://developer.mozilla.org/en-US/docs/Web/API/MediaSource
                mseSourceBuffer = mse.addSourceBuffer(
                  `video/mp4; codecs="${mimeCodec}"`,
                );
              } catch (error) {
                onError?.(error);
                return;
              }
              mseSourceBuffer.mode = "segments";
              if (mseQueue.length > 0 && !mseSourceBuffer.updating) {
                mseSourceBuffer.onupdateend = pushPacket;
              }
              // switch to readPacket after creating SourceBuffer
              ws.onmessage = readPacket;
            } else {
              readPacket(event);
            }
          };
        };
      }
    } catch (e) {
      onError && onError(e);
    }
  };

  document.addEventListener("DOMContentLoaded", function () {
    if (videoEl) {
      videoEl.onloadeddata = () => videoEl.play();
      videoEl.onerror = (e) => console.log("video_error", e);

      //fix stalled video in safari
      videoEl.onpause = () => {
        if (
          videoEl.currentTime >
          videoEl.buffered.end(videoEl.buffered.length - 1)
        ) {
          videoEl.currentTime =
            videoEl.buffered.end(videoEl.buffered.length - 1) - 0.1;
          videoEl.play();
        }
      };
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
