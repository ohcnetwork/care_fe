import * as React from "react";

import { cn } from "@/lib/utils";

interface ReceiptEdgeProps extends React.ComponentProps<"div"> {
  /**
   * Direction the triangles point.
   * - "up" - peaks point up (used at the top of a receipt card)
   * - "down" - peaks point down (used at the bottom of a receipt card)
   */
  direction?: "up" | "down";
  /**
   * Render a soft drop shadow under the triangles. Typically enabled for the
   * bottom edge of a receipt card to give it depth.
   */
  shadow?: boolean;
}

function ReceiptEdge({
  className,
  direction = "down",
  shadow = false,
  ...props
}: ReceiptEdgeProps) {
  const id = React.useId();
  const safeId = id.replace(/:/g, "");
  const patternId = `receipt-edge-${safeId}`;
  const filterId = `receipt-edge-shadow-${safeId}`;

  // Triangle path inside a 10.4 × 12 tile. The triangle itself is 10.4 wide
  // and 9 tall; the extra 3px of vertical space leaves room for the shadow.
  const downPath = "M0 0H10.392L5.196 9Z";
  const upPath = "M0 9H10.392L5.196 0Z";
  const path = direction === "down" ? downPath : upPath;

  return (
    <div
      data-slot="receipt-edge"
      className={cn("h-[9px] w-full", className)}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ display: "block" }}
      >
        <defs>
          <pattern
            id={patternId}
            width="10.4"
            height="12"
            patternUnits="userSpaceOnUse"
          >
            {shadow && (
              <filter
                id={filterId}
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feDropShadow
                  dx="0"
                  dy="1"
                  stdDeviation="1"
                  floodColor="#000"
                  floodOpacity="0.06"
                />
              </filter>
            )}
            <path
              d={path}
              fill="white"
              filter={shadow ? `url(#${filterId})` : undefined}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

export { ReceiptEdge };
