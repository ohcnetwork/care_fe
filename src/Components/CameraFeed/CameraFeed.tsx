import { LegacyRef, useCallback, useEffect, useRef, useState } from "react";
import { AssetData } from "../Assets/AssetTypes";
import useOperateCamera, { PTZPayload } from "./useOperateCamera";
import usePlayer from "./usePlayer";
import { getStreamUrl } from "./utils";
import { classNames, isIOS } from "../../Utils/utils";
import FeedAlert, { FeedAlertState } from "./FeedAlert";
import FeedNetworkSignal from "./FeedNetworkSignal";
import NoFeedAvailable from "./NoFeedAvailable";
import FeedControls from "./FeedControls";
import FeedWatermark from "./FeedWatermark";
import useFullscreen from "../../Common/hooks/useFullscreen";
import useBreakpoints from "../../Common/hooks/useBreakpoints";
import { GetPresetsResponse } from "./routes";

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
}

export default function CameraFeed(props: Props) {
  const playerRef = useRef<HTMLVideoElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const streamUrl = getStreamUrl(props.asset);
  const inlineControls = useBreakpoints({ default: false, sm: true });

  const player = usePlayer(streamUrl, playerRef);

  const [isFullscreen, setFullscreen] = useFullscreen();
  const [state, setState] = useState<FeedAlertState>();
  useEffect(() => setState(player.status), [player.status, setState]);

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

  const initializeStream = useCallback(() => {
    player.initializeStream({
      onSuccess: async () => {
        props.onStreamSuccess?.();
        const { res } = await props.operate({ type: "get_status" });
        if (res?.status === 500) {
          setState("host_unreachable");
        }
      },
      onError: props.onStreamError,
    });
  }, [player.initializeStream]);

  // Start stream on mount
  useEffect(() => initializeStream(), [initializeStream]);

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
    <div ref={playerWrapperRef} className="flex flex-col justify-center">
      <div
        className={classNames(
          "flex max-h-screen flex-col justify-center",
          props.className,
          isFullscreen ? "bg-black" : "bg-zinc-100",
          isIOS && isFullscreen && "px-20",
        )}
      >
        <div
          className={classNames(
            isFullscreen ? "hidden lg:flex" : "flex",
            "items-center justify-between px-4 py-0.5 transition-all duration-500 ease-in-out lg:py-1",
            (() => {
              if (player.status !== "playing") {
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
              player.status !== "playing"
                ? "pointer-events-none opacity-10"
                : "opacity-100",
              "transition-all duration-200 ease-in-out",
            )}
          >
            {props.children}
          </div>
          <div className="flex w-full flex-col items-end justify-end md:flex-row md:items-center md:gap-4">
            <span className="text-xs font-bold md:text-sm">
              {props.asset.name}
            </span>
            {!isIOS && (
              <div
                className={classNames(
                  state === "loading" && "animate-pulse",
                  "-mr-1 -mt-1 scale-90 md:mt-0 md:scale-100",
                )}
              >
                <FeedNetworkSignal
                  playerRef={playerRef as any}
                  playedOn={player.playedOn}
                  status={player.status}
                  onReset={resetStream}
                />
              </div>
            )}
          </div>
        </div>
        <div className="group relative aspect-video bg-black">
          {/* Notifications */}
          <FeedAlert state={state} />
          {player.status === "playing" && <FeedWatermark />}

          {/* No Feed informations */}
          {state === "host_unreachable" && (
            <NoFeedAvailable
              message="Host Unreachable"
              className="text-warning-500"
              icon="l-exclamation-triangle"
              streamUrl={streamUrl}
              asset={props.asset}
              onResetClick={resetStream}
            />
          )}
          {player.status === "offline" && (
            <NoFeedAvailable
              message="Offline"
              className="text-secondary-500"
              icon="l-exclamation-triangle"
              streamUrl={streamUrl}
              asset={props.asset}
              onResetClick={resetStream}
            />
          )}

          {/* Video Player */}
          <video
            onContextMenu={(e) => e.preventDefault()}
            className="absolute inset-x-0 mx-auto aspect-video max-h-full w-full"
            id="mse-video"
            autoPlay
            muted
            disablePictureInPicture
            playsInline
            onPlay={player.onPlayCB}
            onEnded={() => player.setStatus("stop")}
            ref={playerRef as LegacyRef<HTMLVideoElement>}
          />

          {inlineControls && player.status === "playing" && controls}
        </div>
        {!inlineControls && (
          <div
            className={classNames(
              "py-4 transition-all duration-500 ease-in-out",
              player.status !== "playing"
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
