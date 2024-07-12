import { useState } from "react";
import { isAppleDevice } from "../../Utils/utils";
import FeedButton from "./FeedButton";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { PTZPayload } from "./useOperateCamera";
import useBreakpoints from "../../Common/hooks/useBreakpoints";

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
  onMove: (payload: PTZPayload) => void;
  isFullscreen: boolean;
  setFullscreen: (state: boolean) => void;
  onReset: () => void;
}

export default function FeedControls({ shortcutsDisabled, ...props }: Props) {
  const [precision, setPrecision] = useState(1);
  const togglePrecision = () => setPrecision((p) => (p === 16 ? 1 : p << 1));

  const move = (direction: number) => () => {
    props.onMove(payload(direction, precision));
  };

  const isMobilePortrait = useBreakpoints({ default: true, md: false });
  const inlineControls = !(isMobilePortrait && !props.isFullscreen);

  const controls = {
    position: {
      topLeft: (
        <FeedButton onTrigger={move(Actions.UP | Actions.LEFT)}>
          <CareIcon icon="l-triangle" className="-rotate-45" />
        </FeedButton>
      ),
      top: (
        <FeedButton
          onTrigger={move(Actions.UP)}
          helpText="Up"
          shortcut={Shortcuts.MoveUp}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20 md:translate-y-0"
        >
          <CareIcon icon="l-triangle" className="rotate-0" />
        </FeedButton>
      ),
      topRight: (
        <FeedButton onTrigger={move(Actions.UP | Actions.RIGHT)}>
          <CareIcon icon="l-triangle" className="rotate-45" />
        </FeedButton>
      ),
      left: (
        <FeedButton
          onTrigger={move(Actions.LEFT)}
          helpText="Left"
          shortcut={Shortcuts.MoveLeft}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20 -translate-x-1 md:translate-x-0 md:translate-y-0"
        >
          <CareIcon icon="l-triangle" className="-rotate-90" />
        </FeedButton>
      ),
      right: (
        <FeedButton
          onTrigger={move(Actions.RIGHT)}
          helpText="Right"
          shortcut={Shortcuts.MoveRight}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20 -translate-x-2 md:translate-x-0 md:translate-y-0"
        >
          <CareIcon icon="l-triangle" className="rotate-90" />
        </FeedButton>
      ),
      bottomLeft: (
        <FeedButton onTrigger={move(Actions.DOWN | Actions.LEFT)}>
          <CareIcon icon="l-triangle" className="rotate-[-135deg]" />
        </FeedButton>
      ),
      bottom: (
        <FeedButton
          onTrigger={move(Actions.DOWN)}
          helpText="Down"
          shortcut={Shortcuts.MoveDown}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20 -translate-x-2 md:-translate-x-14"
        >
          <CareIcon icon="l-triangle" className="rotate-180" />
        </FeedButton>
      ),
      bottomRight: (
        <FeedButton onTrigger={move(Actions.DOWN | Actions.RIGHT)}>
          <CareIcon icon="l-triangle" className="rotate-[135deg]" />
        </FeedButton>
      ),
    },
    precision: (
      <FeedButton
        onTrigger={togglePrecision}
        helpText="Toggle Precision"
        shortcut={Shortcuts.TogglePrecision}
        className="font-bold"
        shortcutsDisabled={shortcutsDisabled}
        tooltipClassName="-translate-y-20 -translate-x-20 md:translate-x-0 md:translate-y-0"
      >
        {precision}x
      </FeedButton>
    ),
    zoomIn: (
      <FeedButton
        shortcut={Shortcuts.ZoomIn}
        tooltipClassName="tooltip-left translate-y-2 translate-x-1"
        helpText="Zoom In"
        onTrigger={move(Actions.ZOOM_IN)}
        shortcutsDisabled={shortcutsDisabled}
      >
        <CareIcon icon="l-search-plus" />
      </FeedButton>
    ),
    zoomOut: (
      <FeedButton
        shortcut={Shortcuts.ZoomOut}
        tooltipClassName="tooltip-left translate-y-2 translate-x-1"
        helpText="Zoom Out"
        onTrigger={move(Actions.ZOOM_OUT)}
        shortcutsDisabled={shortcutsDisabled}
      >
        <CareIcon icon="l-search-minus" />
      </FeedButton>
    ),

    reset: (
      <FeedButton
        shortcut={Shortcuts.Reset}
        tooltipClassName="tooltip-left translate-y-2 translate-x-1"
        helpText="Reset"
        onTrigger={props.onReset}
        shortcutsDisabled={shortcutsDisabled}
      >
        <CareIcon icon="l-redo" />
      </FeedButton>
    ),
    fullscreen: (
      <FeedButton
        shortcut={Shortcuts.Fullscreen}
        tooltipClassName="tooltip-left translate-y-2 translate-x-1"
        helpText={props.isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        onTrigger={() => props.setFullscreen(!props.isFullscreen)}
        shortcutsDisabled={shortcutsDisabled}
      >
        <CareIcon
          icon={
            props.isFullscreen ? "l-compress-arrows" : "l-expand-arrows-alt"
          }
        />
      </FeedButton>
    ),
  };

  if (inlineControls) {
    return (
      <div className="text-white opacity-0 transition-all delay-100 duration-200 ease-in-out group-hover:opacity-100 group-hover:delay-0">
        <div className="absolute bottom-0 right-6 transition-all delay-100 duration-200 ease-in-out group-hover:bottom-1.5 group-hover:delay-0 md:left-8 md:right-auto md:group-hover:bottom-5">
          <div className="grid scale-75 grid-cols-5 gap-2.5 md:scale-100 md:grid-cols-3 md:gap-1">
            <div className="order-none hidden md:order-1 md:block">
              {controls.position.topLeft}
            </div>
            <div className="order-1 md:order-2">{controls.position.top}</div>
            <div className="order-none hidden md:order-3 md:block">
              {controls.position.topRight}
            </div>
            <div className="order-3 md:order-4">{controls.position.left}</div>
            <div className="order-last md:order-5">{controls.precision}</div>
            <div className="order-4 md:order-6">{controls.position.right}</div>
            <div className="order-none hidden md:order-7 md:block">
              {controls.position.bottomLeft}
            </div>
            <div className="order-2 md:order-8">{controls.position.bottom}</div>
            <div className="order-none hidden md:order-9 md:block">
              {controls.position.bottomRight}
            </div>
          </div>
        </div>
        <div className="absolute -bottom-3 right-0 scale-75 transition-all delay-100 duration-200 ease-in-out group-hover:right-2 group-hover:delay-0 md:bottom-5 md:scale-100 md:group-hover:right-8">
          <div className="flex flex-col items-center justify-center gap-2.5 md:gap-1">
            {controls.zoomIn}
            {controls.zoomOut}
            {controls.reset}
            {controls.fullscreen}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-2">
        {controls.zoomIn}
        {controls.zoomOut}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>{controls.position.topLeft}</div>
        <div>{controls.position.top}</div>
        <div>{controls.position.topRight}</div>
        <div>{controls.position.left}</div>
        <div>{controls.precision}</div>
        <div>{controls.position.right}</div>
        <div>{controls.position.bottomLeft}</div>
        <div>{controls.position.bottom}</div>
        <div>{controls.position.bottomRight}</div>
      </div>
      <div className="flex flex-col gap-2">
        {controls.reset}
        {controls.fullscreen}
      </div>
    </div>
  );
}
