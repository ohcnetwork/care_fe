import { useCallback, useEffect, useRef, useState } from "react";

import { AssetData } from "@/components/Assets/AssetTypes";
import FeedAlert, {
  FeedAlertState,
  StreamStatus,
} from "@/components/CameraFeed/FeedAlert";
import FeedControls from "@/components/CameraFeed/FeedControls";
import FeedNetworkSignal from "@/components/CameraFeed/FeedNetworkSignal";
import FeedWatermark from "@/components/CameraFeed/FeedWatermark";
import NoFeedAvailable from "@/components/CameraFeed/NoFeedAvailable";
import { GetPresetsResponse } from "@/components/CameraFeed/routes";
import useOperateCamera, {
  PTZPayload,
} from "@/components/CameraFeed/useOperateCamera";
import { getStreamUrl } from "@/components/CameraFeed/utils";
import VideoPlayer from "@/components/CameraFeed/videoPlayer";
import AssetInfoPopover from "@/components/Common/AssetInfoPopover";

import useBreakpoints from "@/hooks/useBreakpoints";
import useFullscreen from "@/hooks/useFullscreen";

import { classNames, isIOS } from "@/Utils/utils";

interface Props {
  children?: React.ReactNode;
  asset: AssetData;
  preset?: PTZPayload;
  className?: string;
  // Callbacks
  onCameraPresetsObtained?: (presets: Record<string, number>) => void;
  onStreamSuccess?: () => void;
  onStreamError?: () => void;
  // Controls
  constrolsDisabled?: boolean;
  shortcutsDisabled?: boolean;
  onMove?: () => void;
  operate: ReturnType<typeof useOperateCamera>["operate"];
  hideAssetInfo?: boolean;
}

export default function CameraFeed(props: Props) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const [streamUrl, setStreamUrl] = useState<string>("");
  const inlineControls = useBreakpoints({ default: false, sm: true });

  const [isFullscreen, setFullscreen] = useFullscreen();
  const [state, setState] = useState<FeedAlertState>();
  const [playedOn, setPlayedOn] = useState<Date>();
  const [playerStatus, setPlayerStatus] = useState<StreamStatus>("stop");
  // Move camera when selected preset has changed
  useEffect(() => {
    async function move(preset: PTZPayload) {
      setState("moving");
      const { res } = await props.operate({
        type: "absolute_move",
        data: preset,
      });
      setTimeout(() => setState((s) => (s === "moving" ? undefined : s)), 4000);
      if (res?.status === 500) {
        setState("host_unreachable");
      }
    }

    if (props.preset) {
      move(props.preset);
    }
  }, [props.preset]);

  // Get camera presets (only if onCameraPresetsObtained is provided)
  useEffect(() => {
    if (!props.onCameraPresetsObtained) return;
    async function getPresets(cb: (presets: Record<string, number>) => void) {
      const { res, data } = await props.operate({ type: "get_presets" });
      if (res?.ok && data) {
        cb((data as GetPresetsResponse).result);
      }
    }
    getPresets(props.onCameraPresetsObtained);
  }, [props.operate, props.onCameraPresetsObtained]);

  const initializeStream = useCallback(async () => {
    if (!playerRef.current) return;
    setPlayerStatus("loading");
    await props
      .operate({ type: "get_stream_token" })
      .then(({ res, data }) => {
        if (res?.status != 200) {
          setState("host_unreachable");
          return props.onStreamError?.();
        }
        const result = data?.result as { token: string };
        return setStreamUrl(getStreamUrl(props.asset, result.token));
      })
      .catch(() => {
        setState("host_unreachable");
        return props.onStreamError?.();
      });
  }, []);

  // Start stream on mount
  useEffect(() => {
    initializeStream();
  }, []);

  const resetStream = () => {
    setState("loading");
    initializeStream();
  };

  const controls = !props.constrolsDisabled && (
    <FeedControls
      inlineView={inlineControls}
      shortcutsDisabled={props.shortcutsDisabled}
      isFullscreen={isFullscreen}
      setFullscreen={(value) => {
        if (!value) {
          setFullscreen(false);
          return;
        }

        if (isIOS) {
          const element = document.querySelector("video");
          if (!element) {
            return;
          }
          setFullscreen(true, element, true);
          return;
        }

        if (!playerRef.current) {
          return;
        }

        setFullscreen(
          true,
          playerWrapperRef.current || (playerRef.current as HTMLElement),
          true,
        );
      }}
      onReset={resetStream}
      onMove={async (data) => {
        setState("moving");
        const { res } = await props.operate({ type: "relative_move", data });
        props.onMove?.();
        setTimeout(() => {
          setState((state) => (state === "moving" ? undefined : state));
        }, 4000);
        if (res?.status === 500) {
          setState("host_unreachable");
        }
      }}
    />
  );

  return (
    <div ref={playerWrapperRef} className="flex h-full flex-col justify-center">
      <div
        className={classNames(
          "flex max-h-screen min-h-full flex-col justify-center",
          props.className,
          isFullscreen ? "bg-black" : "bg-zinc-100",
          isIOS && isFullscreen && "px-20",
        )}
      >
        <div
          className={classNames(
            isFullscreen ? "hidden lg:flex" : "flex",
            "shrink-0 items-center justify-between px-4 py-0.5 transition-all duration-500 ease-in-out lg:py-1",
            (() => {
              if (playerStatus !== "playing") {
                return "bg-black text-zinc-400";
              }

              if (isFullscreen) {
                return "bg-zinc-900 text-white";
              }

              return "bg-zinc-500/20 text-zinc-800";
            })(),
          )}
        >
          <div
            className={classNames(
              playerStatus !== "playing"
                ? "pointer-events-none opacity-10"
                : "opacity-100",
              "transition-all duration-200 ease-in-out",
            )}
          >
            {props.children}
          </div>
          <div className="flex w-full flex-col items-end justify-end md:flex-row md:items-center md:gap-4">
            {!props.hideAssetInfo && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold md:text-sm">
                  {props.asset.name}
                </span>
                <AssetInfoPopover
                  asset={props.asset}
                  className="absolute z-[100] mt-2 w-56 -translate-x-full -translate-y-4 rounded-md bg-white md:w-[350px] md:-translate-x-full md:-translate-y-2"
                />
              </div>
            )}

            {!isIOS && (
              <div
                className={classNames(
                  state === "loading" && "animate-pulse",
                  "-mr-1 -mt-1 scale-90 md:mt-0 md:scale-100",
                )}
              >
                <FeedNetworkSignal
                  playerRef={playerRef as any}
                  playedOn={playedOn}
                  status={playerStatus}
                  onReset={resetStream}
                />
              </div>
            )}
          </div>
        </div>
        <div className="group relative flex-1 bg-black">
          {/* Notifications */}
          <FeedAlert state={state} />
          {playerStatus === "playing" && <FeedWatermark />}

          {/* No Feed informations */}
          {(() => {
            switch (state) {
              case "host_unreachable":
                return (
                  <NoFeedAvailable
                    message="Host Unreachable"
                    className="text-warning-500"
                    icon="l-exclamation-triangle"
                    streamUrl=""
                    asset={props.asset}
                    onResetClick={resetStream}
                  />
                );
              case "offline":
                return (
                  <NoFeedAvailable
                    message="Offline"
                    className="text-secondary-500"
                    icon="l-exclamation-triangle"
                    streamUrl=""
                    asset={props.asset}
                    onResetClick={resetStream}
                  />
                );
            }
          })()}

          {/* Video Player */}
          <VideoPlayer
            playerRef={playerRef}
            streamUrl={streamUrl}
            className="max-h-[calc(100vh-40px)] w-full object-contain"
            onPlay={() => {
              setPlayedOn(new Date());
              setState("playing");
              setPlayerStatus("playing");
            }}
            onEnded={() => setPlayerStatus("stop")}
            onSuccess={async () => {
              props.onStreamSuccess?.();
              const { res } = await props.operate({ type: "get_status" });
              if (res?.status === 500) {
                setState("host_unreachable");
              }
            }}
            onError={props.onStreamError}
          />

          {inlineControls && playerStatus === "playing" && controls}
        </div>
        {!inlineControls && (
          <div
            className={classNames(
              "py-4 transition-all duration-500 ease-in-out",
              playerStatus !== "playing"
                ? "pointer-events-none px-6 opacity-30"
                : "px-12 opacity-100",
            )}
          >
            {controls}
          </div>
        )}
      </div>
    </div>
  );
}
