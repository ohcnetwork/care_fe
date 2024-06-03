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
import Fullscreen from "../../CAREUI/misc/Fullscreen";
import FeedWatermark from "./FeedWatermark";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { Error } from "../../Utils/Notifications";

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
  const streamUrl = getStreamUrl(props.asset);

  const player = usePlayer(streamUrl, playerRef);
  const operate = useOperateCamera(props.asset.id, props.silent);

  const [isFullscreen, setFullscreen] = useState(false);
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
    <Fullscreen
      fullscreen={isFullscreen}
      onExit={(reason) => {
        setFullscreen(false);

        if (reason === "DEVICE_UNSUPPORTED") {
          // iOS webkit allows only video/iframe elements to call full-screen
          // APIs. But we need to show controls too, not just the video element.
          Error({
            msg: "This device does not support viewing this content in full-screen.",
          });
        }
      }}
    >
      <div
        className={classNames(
          "flex flex-col overflow-clip rounded-xl bg-black md:max-h-screen",
          props.className,
          isAppleDevice && isFullscreen && "px-20",
        )}
      >
        <div className="flex items-center justify-between bg-zinc-900 px-4 py-1.5 md:py-2">
          {props.children}
          <div className="flex w-full items-center justify-end gap-1 md:gap-4">
            <span className="text-base font-semibold text-white">
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
              setFullscreen={setFullscreen}
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
    </Fullscreen>
  );
}
