import { transformIcons } from "./icon";
import { useEffect } from "react";

export interface CareIconProps {
  className?: string | undefined;
  onClick?: React.MouseEventHandler<HTMLSpanElement> | undefined;
}

/**
 * ### CARE's Official Icon Library.
 * @param className icon class name
 * @returns icon component
 * @example ```<CareIcon className="care-l-hospital" /> ```
 *
 * @see [icon library](https://iconscout.com/unicons/)
 */
export default function CareIcon({ className, onClick }: CareIconProps) {
  useEffect(() => transformIcons(), [className]);
  return (
    <span onClick={onClick} key={className}>
      <i className={`care ${className}`} />
    </span>
  );
}
