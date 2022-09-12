import clsx from "clsx";
import { ReactNode, useState } from "react";

export default function ToolTip(props: {
  children: ReactNode;
  text: ReactNode;
  position?: "TOP" | "BOTTOM" | "LEFT" | "RIGHT";
}) {
  const position = props.position || "TOP";

  const [status, show] = useState(false);

  const style = clsx(
    "absolute bg-black/50 backdrop-blur rounded text-white transition px-2 py-1 z-50 w-[150px] text-center block",
    position === "TOP" && "bottom-[calc(100%+5px)] left-[calc(50%-75px)]",
    position === "BOTTOM" && "top-[calc(100%+5px)] left-[calc(50%-75px)]",
    position === "LEFT" && "right-[calc(100%+5px)] top-[calc(50%-75px)]",
    position === "RIGHT" && "left-[calc(100%+5px)] top-[calc(50%-75px)]",
    status === true
      ? "visible opacity-100 -translate-y-1"
      : "invisible opacity-0 translate-y-0"
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
