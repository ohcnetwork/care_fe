import { useEffect } from "react";
import { transformIcons } from "./icon";

export interface CareIconProps {
  className?: string | undefined;
}

/**
 * ### CARE's Official Icon Library.
 * @param className icon class name
 * @returns icon component
 * @example ```<CareIcon className="care-l-hospital" /> ```
 *
 * @see [icon library](https://iconscout.com/unicons/)
 */
export default function CareIcon({ className }: CareIconProps) {
  useEffect(() => transformIcons(), [className]);
  return (
    <span key={className}>
      <i className={`care ${className}`} />
    </span>
  );
}
