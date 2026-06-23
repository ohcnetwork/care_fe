import * as React from "react";

import { cn } from "@/lib/utils";

function DottedDivider({
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<"div">, "children">) {
  const id = React.useId();
  const patternId = `dotted-divider-${id.replace(/:/g, "")}`;

  return (
    <div
      data-slot="dotted-divider"
      className={cn("h-2 w-full text-gray-300 dark:text-gray-700", className)}
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
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="0.5" cy="0.5" r="0.5" fill="currentColor" />
            <circle cx="0.5" cy="7.5" r="0.5" fill="currentColor" />
            <circle cx="4" cy="4" r="0.5" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}

export { DottedDivider };
