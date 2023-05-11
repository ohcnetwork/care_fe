import { transformIcons } from "./icon";
import { useEffect } from "react";

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
export default function CareIcon({
  className,
  ...rest
}: CareIconProps & React.HTMLAttributes<HTMLSpanElement>) {
  useEffect(() => transformIcons(), [className]);
  return (
    <span {...rest} key={className}>
      <i className={`care ${className}`} />
    </span>
  );
}
