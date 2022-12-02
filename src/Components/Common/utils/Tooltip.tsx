import { ReactNode, useState } from "react";
import { classNames } from "../../../Utils/utils";

interface TooltipProps {
  children: ReactNode;
  text: ReactNode;
  position?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT" | "CUSTOM";
  className?: string;
}

/**
 * Deprecated. Use `tooltip` and `tooltip-text` with `tooltip-{left/right/top/bottom}` classes on elements.
 *
 * **Example:**
 * ```html
 * <button class="tooltip">
 *   <span class="tooltip-text tooltip-bottom">Tooltip Text</span>
 *   <!--children of component-->
 *   <span>Hover over me</span>
 * </button>
 * ```
 */
export default function ToolTip(props: TooltipProps) {
  const position = props.position || "TOP";

  const [status, show] = useState(false);

  const style = classNames(
    "absolute bg-black/50 backdrop-blur rounded text-white transition px-2 py-1 z-50 w-[150px] text-center block",
    position === "TOP" && "bottom-[calc(100%+5px)] left-[calc(50%-75px)]",
    position === "BOTTOM" && "top-[calc(100%+5px)] left-[calc(50%-75px)]",
    position === "LEFT" && "right-[calc(100%+5px)] top-[calc(50%-75px)]",
    position === "RIGHT" && "left-[calc(100%+5px)] top-[calc(50%-75px)]",
    status === true
      ? "visible opacity-100 -translate-y-1"
      : "invisible opacity-0 translate-y-0",
    props.className && props.className
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => show(true)}
      onMouseLeave={() => show(false)}
    >
      <div className={style}>{props.text}</div>
      {props.children}
    </div>
  );
}
