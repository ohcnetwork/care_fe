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

const metaKey = isAppleDevice ? "Meta" : "Control";

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
  inlineView: boolean;
}

export default function FeedControls({ shortcutsDisabled, ...props }: Props) {
  const [precision, setPrecision] = useState(1);
  const togglePrecision = () => setPrecision((p) => (p === 16 ? 1 : p << 1));

  const move = (direction: number) => () => {
    props.onMove(payload(direction, precision));
  };

  const controls = {
    position: (
      <>
        <FeedButton
          shortcuts={[[metaKey, "7"]]}
          onTrigger={move(Actions.UP | Actions.LEFT)}
          shortcutsDisabled={shortcutsDisabled}
          helpText="Move Diagonally Up-Left"
          tooltipClassName="-translate-y-20"
        >
          <CareIcon icon="l-triangle" className="-rotate-45" />
        </FeedButton>

        <FeedButton
          shortcuts={[
            [metaKey, "8"],
            [metaKey, "Shift", "ArrowUp"],
          ]}
          onTrigger={move(Actions.UP)}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20 -translate-x-11"
          helpText="Move Up"
        >
          <CareIcon icon="l-triangle" className="rotate-0" />
        </FeedButton>

        <FeedButton
          shortcuts={[[metaKey, "9"]]}
          onTrigger={move(Actions.UP | Actions.RIGHT)}
          shortcutsDisabled={shortcutsDisabled}
          helpText="Move Diagonally Up-Right"
          tooltipClassName="-translate-y-20 -translate-x-24"
        >
          <CareIcon icon="l-triangle" className="rotate-45" />
        </FeedButton>

        <FeedButton
          shortcuts={[
            [metaKey, "4"],
            [metaKey, "Shift", "ArrowLeft"],
          ]}
          onTrigger={move(Actions.LEFT)}
          shortcutsDisabled={shortcutsDisabled}
          helpText="Move Left"
        >
          <CareIcon icon="l-triangle" className="-rotate-90" />
        </FeedButton>

        <FeedButton
          shortcuts={[["Shift", "P"]]}
          onTrigger={togglePrecision}
          helpText="Toggle Precision"
          className="font-bold"
          shortcutsDisabled={shortcutsDisabled}
        >
          {precision}x
        </FeedButton>

        <FeedButton
          onTrigger={move(Actions.RIGHT)}
          shortcuts={[
            [metaKey, "6"],
            [metaKey, "Shift", "ArrowRight"],
          ]}
          shortcutsDisabled={shortcutsDisabled}
          helpText="Move Right"
          tooltipClassName="-translate-y-9 translate-x-11"
        >
          <CareIcon icon="l-triangle" className="rotate-90" />
        </FeedButton>

        <FeedButton
          shortcuts={[[metaKey, "1"]]}
          onTrigger={move(Actions.DOWN | Actions.LEFT)}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20"
          helpText="Move Diagonally Down-Left"
        >
          <CareIcon icon="l-triangle" className="rotate-[-135deg]" />
        </FeedButton>

        <FeedButton
          onTrigger={move(Actions.DOWN)}
          shortcuts={[
            [metaKey, "2"],
            [metaKey, "Shift", "ArrowDown"],
          ]}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-20  -translate-x-14"
          helpText="Move Down"
        >
          <CareIcon icon="l-triangle" className="rotate-180" />
        </FeedButton>

        <FeedButton
          shortcuts={[[metaKey, "3"]]}
          onTrigger={move(Actions.DOWN | Actions.RIGHT)}
          shortcutsDisabled={shortcutsDisabled}
          tooltipClassName="-translate-y-9 translate-x-11"
          helpText="Move Diagonally Down-Right"
        >
          <CareIcon icon="l-triangle" className="rotate-[135deg]" />
        </FeedButton>
      </>
    ),
    zoom: (
      <>
        <FeedButton
          shortcuts={[[metaKey, "I"]]}
          tooltipClassName="tooltip-left translate-y-2 translate-x-1"
          helpText="Zoom In"
          onTrigger={move(Actions.ZOOM_IN)}
          shortcutsDisabled={shortcutsDisabled}
        >
          <CareIcon icon="l-search-plus" />
        </FeedButton>
        <FeedButton
          shortcuts={[[metaKey, "O"]]}
          tooltipClassName="tooltip-left translate-y-2 translate-x-1"
          helpText="Zoom Out"
          onTrigger={move(Actions.ZOOM_OUT)}
          shortcutsDisabled={shortcutsDisabled}
        >
          <CareIcon icon="l-search-minus" />
        </FeedButton>
      </>
    ),

    reset: (
      <FeedButton
        shortcuts={[["Shift", "R"]]}
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
        shortcuts={[["Shift", "F"]]}
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

  if (props.inlineView) {
    return (
      <div className="text-white opacity-0 transition-all delay-100 duration-200 ease-in-out group-hover:opacity-100 group-hover:delay-0">
        <div className="absolute bottom-0 left-8 transition-all delay-100 duration-200 ease-in-out group-hover:bottom-5 group-hover:delay-0">
          <div className="grid grid-cols-3 gap-1">{controls.position}</div>
        </div>
        <div className="absolute  bottom-5 right-0 transition-all delay-100 duration-200 ease-in-out group-hover:right-8 group-hover:delay-0">
          <div className="flex flex-col items-center justify-center gap-1">
            {controls.zoom}
            {controls.reset}
            {controls.fullscreen}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-col gap-2">{controls.zoom}</div>
      <div className="grid grid-cols-3 gap-2">{controls.position}</div>
      <div className="flex flex-col gap-2">
        {controls.reset}
        {controls.fullscreen}
      </div>
    </div>
  );
}
