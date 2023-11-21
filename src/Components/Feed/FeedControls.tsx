import FeedButtons from "./FeedButton";
import { PTZAction } from "./utils";

interface Props {
  shortcutsDisabled?: boolean;
  onMove?: (direction: PTZAction) => void;
}

export default function FeedControls({ shortcutsDisabled, onMove }: Props) {
  return (
    <div className="text-white opacity-0 transition-all delay-100 duration-200 ease-in-out group-hover:opacity-100 group-hover:delay-0">
      {/* Move Controls */}
      {onMove && (
        <>
          <div className="absolute bottom-0 left-8 transition-all delay-100 duration-200 ease-in-out group-hover:bottom-5 group-hover:delay-0">
            <div className="flex flex-col items-center justify-center gap-1">
              <FeedButtons.MoveUp
                onTrigger={() => onMove("up")}
                shortcutsDisabled={shortcutsDisabled}
              />
              <div className="flex flex-row items-center justify-center gap-1">
                <FeedButtons.MoveLeft
                  onTrigger={() => onMove("left")}
                  shortcutsDisabled={shortcutsDisabled}
                />
                <FeedButtons.MoveDown
                  onTrigger={() => onMove("down")}
                  shortcutsDisabled={shortcutsDisabled}
                />
                <FeedButtons.MoveRight
                  onTrigger={() => onMove("right")}
                  shortcutsDisabled={shortcutsDisabled}
                />
              </div>
            </div>
          </div>

          <div className="absolute bottom-5 right-0 transition-all delay-100 duration-200 ease-in-out group-hover:right-8 group-hover:delay-0">
            <div className="flex flex-col items-center justify-center gap-1">
              <FeedButtons.ZoomIn
                onTrigger={() => onMove("zoomIn")}
                shortcutsDisabled={shortcutsDisabled}
              />
              <FeedButtons.ZoomOut
                onTrigger={() => onMove("zoomOut")}
                shortcutsDisabled={shortcutsDisabled}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
