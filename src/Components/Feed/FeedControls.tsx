import { useState } from "react";
import { isAppleDevice } from "../../Utils/utils";
import FeedButton from "./FeedButton";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { PTZPayload } from "./useOperateCamera";

const Actions = {
  UP: 1 << 0,
  DOWN: 1 << 1,
  LEFT: 1 << 2,
  RIGHT: 1 << 3,
  ZOOM_IN: 1 << 4,
  ZOOM_OUT: 1 << 5,
} as const;

const Shortcuts = {
  MoveUp: [isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowUp"],
  MoveLeft: [isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowLeft"],
  MoveDown: [isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowDown"],
  MoveRight: [isAppleDevice ? "Meta" : "Ctrl", "Shift", "ArrowRight"],
  TogglePrecision: ["Shift", "P"],
  ZoomIn: [isAppleDevice ? "Meta" : "Ctrl", "I"],
  ZoomOut: [isAppleDevice ? "Meta" : "Ctrl", "O"],
  Reset: ["Shift", "R"],
  SavePreset: [isAppleDevice ? "Meta" : "Ctrl", "Shift", "S"],
  Fullscreen: ["Shift", "F"],
};

export type PTZAction = keyof typeof Actions;

/**
 * Returns the PTZ payload for the given action
 *
 * Example:
 * ```
 * payload(Actions.TOP | Actions.LEFT);
 * ```
 *
 * @param action An Actions or a combination of Actions
 * @param precision Precision of the PTZ action
 * @returns The PTZ payload
 */
const payload = (action: number, precision: number) => {
  let [x, y, zoom] = [0, 0, 0];
  const delta = 0.1 / Math.max(1, precision);

  const _ = (direction: number) => action & direction && delta;

  x -= _(Actions.LEFT);
  x += _(Actions.RIGHT);
  y += _(Actions.UP);
  y -= _(Actions.DOWN);
  zoom += _(Actions.ZOOM_IN);
  zoom -= _(Actions.ZOOM_OUT);

  return { x, y, zoom };
};

interface Props {
  shortcutsDisabled?: boolean;
  onMove?: (payload: PTZPayload) => void;
  isFullscreen: boolean;
  setFullscreen: (state: boolean) => void;
  onReset: () => void;
}

export default function FeedControls({
  shortcutsDisabled,
  onMove,
  ...props
}: Props) {
  const [precision, setPrecision] = useState(1);
  const togglePrecision = () => setPrecision((p) => (p === 16 ? 1 : p << 1));

  const move =
    onMove &&
    ((direction: number) => () => onMove(payload(direction, precision)));

  return (
    <div className="text-white opacity-0 transition-all delay-100 duration-200 ease-in-out group-hover:opacity-100 group-hover:delay-0">
      {/* Move Controls */}
      {move && (
        <>
          <div className="absolute bottom-0 left-8 transition-all delay-100 duration-200 ease-in-out group-hover:bottom-5 group-hover:delay-0">
            <div className="grid grid-cols-3 gap-1">
              <FeedButton onTrigger={move(Actions.UP | Actions.LEFT)}>
                <CareIcon icon="l-triangle" className="-rotate-45" />
              </FeedButton>
              <FeedButton
                onTrigger={move(Actions.UP)}
                helpText="Up"
                shortcut={Shortcuts.MoveUp}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-triangle" className="rotate-0" />
              </FeedButton>
              <FeedButton onTrigger={move(Actions.UP | Actions.RIGHT)}>
                <CareIcon icon="l-triangle" className="rotate-45" />
              </FeedButton>
              <FeedButton
                onTrigger={move(Actions.LEFT)}
                helpText="Left"
                shortcut={Shortcuts.MoveLeft}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-triangle" className="-rotate-90" />
              </FeedButton>

              <FeedButton
                onTrigger={togglePrecision}
                helpText="Toggle Precision"
                shortcut={Shortcuts.TogglePrecision}
                className="font-bold"
                shortcutsDisabled={shortcutsDisabled}
              >
                {precision}x
              </FeedButton>

              <FeedButton
                onTrigger={move(Actions.RIGHT)}
                helpText="Right"
                shortcut={Shortcuts.MoveRight}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-triangle" className="rotate-90" />
              </FeedButton>

              <FeedButton onTrigger={move(Actions.DOWN | Actions.LEFT)}>
                <CareIcon icon="l-triangle" className="rotate-[-135deg]" />
              </FeedButton>

              <FeedButton
                onTrigger={move(Actions.DOWN)}
                helpText="Down"
                shortcut={Shortcuts.MoveDown}
                shortcutsDisabled={shortcutsDisabled}
                tooltipClassName="tooltip-top"
              >
                <CareIcon icon="l-triangle" className="rotate-180" />
              </FeedButton>

              <FeedButton onTrigger={move(Actions.DOWN | Actions.RIGHT)}>
                <CareIcon icon="l-triangle" className="rotate-[135deg]" />
              </FeedButton>
            </div>
          </div>

          <div className="absolute bottom-5 right-0 transition-all delay-100 duration-200 ease-in-out group-hover:right-8 group-hover:delay-0">
            <div className="flex flex-col items-center justify-center gap-1">
              <FeedButton
                shortcut={Shortcuts.ZoomIn}
                tooltipClassName="tooltip-left translate-y-2 translate-x-1"
                helpText="Zoom In"
                onTrigger={move(Actions.ZOOM_IN)}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-search-plus" />
              </FeedButton>
              <FeedButton
                shortcut={Shortcuts.ZoomOut}
                tooltipClassName="tooltip-left translate-y-2 translate-x-1"
                helpText="Zoom Out"
                onTrigger={move(Actions.ZOOM_OUT)}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-search-minus" />
              </FeedButton>
              <FeedButton
                shortcut={Shortcuts.Reset}
                tooltipClassName="tooltip-left translate-y-2 translate-x-1"
                helpText="Reset"
                onTrigger={props.onReset}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-redo" />
              </FeedButton>
              {/* TODO: implement this when this is used in where presets can be saved. */}
              {/* <FeedButton
                shortcut={Shortcuts.SavePreset}
                tooltipClassName="tooltip-left translate-y-2 translate-x-1"
                helpText="Save current view to preset"
                onTrigger={() => console.error("Not implemented")}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon icon="l-save" />
              </FeedButton> */}
              <FeedButton
                shortcut={Shortcuts.Fullscreen}
                tooltipClassName="tooltip-left translate-y-2 translate-x-1"
                helpText={
                  props.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"
                }
                onTrigger={() => props.setFullscreen(!props.isFullscreen)}
                shortcutsDisabled={shortcutsDisabled}
              >
                <CareIcon
                  icon={
                    props.isFullscreen
                      ? "l-compress-arrows"
                      : "l-expand-arrows-alt"
                  }
                />
              </FeedButton>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
