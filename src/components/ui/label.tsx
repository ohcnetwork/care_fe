// CareUI registry source: ohcnetwork/careui (4e143863).
/**
 * @name label
 * @description Renders an accessible label associated with controls.
 * @dependencies class-variance-authority
 * @type registry:ui
 */
import * as React from "react";

import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "flex items-center gap-2 text-sm leading-none font-medium select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50 peer-data-disabled:cursor-not-allowed peer-data-disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
