import { useEffect, useRef } from "react";

declare const ManagedMediaSource: typeof MediaSource;

interface UseMSEMediaPlayerOption {
  videoEl: HTMLVideoElement | null;
}

export enum StreamStatus {
  Playing,
  Stop,
  Loading,
  Offline,
}
export interface IOptions {
  url?: string;
  onSuccess?: (resp: any) => void;
  onError?: (err: any) => void;
}

export const useMSEMediaPlayer = ({ videoEl }: UseMSEMediaPlayerOption) => {
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

  const startStream = ({ url, onError, onSuccess }: IOptions = {}) => {
    try {
      if (!videoEl || !url) return;

      //https://developer.mozilla.org/en-US/docs/Web/API/MediaSource
      let mse: MediaSource;
      if (typeof ManagedMediaSource !== "undefined") {
        mse = new ManagedMediaSource();
        videoEl.disableRemotePlayback = true;
        videoEl.srcObject = mse;
      } else {
        mse = new MediaSource();
        videoEl.src = URL.createObjectURL(mse);
      }
      let ws: WebSocket | null = null;
      mse.onsourceopen = function () {
        ws = new WebSocket(url);
        wsRef.current = ws;
        ws.binaryType = "arraybuffer";
        ws.onopen = (_) => onSuccess && onSuccess(undefined);
        ws.onerror = (event) => onError && onError(event);
        ws.onmessage = function (event) {
          const data = new Uint8Array(event.data);
          if (+data[0] === 9) {
            const mimeCodec = new TextDecoder("utf-8").decode(data.slice(1));
            try {
              //https://developer.mozilla.org/en-US/docs/Web/API/SourceBuffer
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
            ws!.onmessage = readPacket;
          } else {
            readPacket(event);
          }
        };
      };
      mse.onsourceended = () => ws?.close();
      mse.onsourceclose = () => ws?.close();
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

  return { startStream };
};
