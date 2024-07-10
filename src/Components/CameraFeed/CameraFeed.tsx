import { LegacyRef, useCallback, useEffect, useRef, useState } from "react";
import { AssetData } from "../Assets/AssetTypes";
import useOperateCamera, { PTZPayload } from "./useOperateCamera";
import usePlayer from "./usePlayer";
import { getStreamUrl } from "./utils";
import ReactPlayer from "react-player";
import { classNames, isAppleDevice, isIOS } from "../../Utils/utils";
import FeedAlert, { FeedAlertState } from "./FeedAlert";
import FeedNetworkSignal from "./FeedNetworkSignal";
import NoFeedAvailable from "./NoFeedAvailable";
import FeedControls from "./FeedControls";
import FeedWatermark from "./FeedWatermark";
import CareIcon from "../../CAREUI/icons/CareIcon";
import useFullscreen from "../../Common/hooks/useFullscreen";

interface Props {
  children?: React.ReactNode;
  asset: AssetData;
  preset?: PTZPayload;
  silent?: boolean;
  className?: string;
  // Callbacks
  onCameraPresetsObtained?: (presets: Record<string, number>) => void;
  onStreamSuccess?: () => void;
  onStreamError?: () => void;
  // Controls
  constrolsDisabled?: boolean;
  shortcutsDisabled?: boolean;
  onMove?: () => void;
  onReset?: () => void;
}

export default function CameraFeed(props: Props) {
  const playerRef = useRef<HTMLVideoElement | ReactPlayer | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement>(null);
  const streamUrl = getStreamUrl(props.asset);

  const player = usePlayer(streamUrl, playerRef);
  const operate = useOperateCamera(props.asset.id, props.silent);

  const [isFullscreen, setFullscreen] = useFullscreen();
  const [state, setState] = useState<FeedAlertState>();
  useEffect(() => setState(player.status), [player.status, setState]);

  // Move camera when selected preset has changed
  useEffect(() => {
    async function move(preset: PTZPayload) {
      setState("moving");
      const { res } = await operate({ type: "absolute_move", data: preset });
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
      const { res, data } = await operate({ type: "get_presets" });
      if (res?.ok && data) {
        cb((data as { result: Record<string, number> }).result);
      }
    }
    getPresets(props.onCameraPresetsObtained);
  }, [operate, props.onCameraPresetsObtained]);

  const initializeStream = useCallback(() => {
    player.initializeStream({
      onSuccess: async () => {
        props.onStreamSuccess?.();
        const { res } = await operate({ type: "get_status" });
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
    props.onReset?.();
    initializeStream();
  };

  return (
    <div ref={playerWrapperRef} className="flex flex-col justify-center">
      <div
        className={classNames(
          "flex flex-col justify-center overflow-hidden rounded-xl bg-black md:max-h-screen",
          props.className,
          isAppleDevice && isFullscreen && "px-20",
        )}
      >
        <div className="flex items-center justify-between bg-zinc-900 px-4 pt-1 md:py-2">
          {props.children}
          <div className="flex w-full flex-col items-end justify-end md:flex-row md:items-center md:gap-4">
            <span className="text-xs font-semibold text-white md:text-base">
              <CareIcon
                icon="l-video"
                className="hidden pr-2 text-lg text-zinc-400 md:inline-block"
              />
              {props.asset.name}
            </span>
            {!isIOS && (
              <div className={state === "loading" ? "animate-pulse" : ""}>
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

        <div className="group relative aspect-video">
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
              className="text-gray-500"
              icon="l-exclamation-triangle"
              streamUrl={streamUrl}
              asset={props.asset}
              onResetClick={resetStream}
            />
          )}

          {/* Video Player */}
          {isIOS ? (
            <div className="absolute inset-0">
              <ReactPlayer
                url={streamUrl}
                ref={playerRef.current as LegacyRef<ReactPlayer>}
                controls={false}
                pip={false}
                playsinline
                playing
                muted
                width="100%"
                height="100%"
                onPlay={player.onPlayCB}
                onEnded={() => player.setStatus("stop")}
                onError={(e, _, hlsInstance) => {
                  if (e === "hlsError") {
                    const recovered = hlsInstance.recoverMediaError();
                    console.info(recovered);
                  }
                }}
              />
            </div>
          ) : (
            <video
              onContextMenu={(e) => e.preventDefault()}
              className="absolute inset-x-0 mx-auto aspect-video max-h-screen w-full"
              id="mse-video"
              autoPlay
              muted
              disablePictureInPicture
              playsInline
              onPlay={player.onPlayCB}
              onEnded={() => player.setStatus("stop")}
              ref={playerRef as LegacyRef<HTMLVideoElement>}
            />
          )}

          {/* Controls */}
          {!props.constrolsDisabled && player.status === "playing" && (
            <FeedControls
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
                  playerWrapperRef.current ||
                    (playerRef.current as HTMLElement),
                  true,
                );
              }}
              onReset={resetStream}
              onMove={async (data) => {
                props.onMove?.();
                setState("moving");
                const { res } = await operate({ type: "relative_move", data });
                setTimeout(() => {
                  setState((state) => (state === "moving" ? undefined : state));
                }, 4000);
                if (res?.status === 500) {
                  setState("host_unreachable");
                }
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
