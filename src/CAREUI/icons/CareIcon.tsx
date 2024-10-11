import iconData from "./UniconPaths.json";
import { transformIcons } from "./icon";
import { useEffect } from "react";

export type IconName = keyof typeof iconData;

export interface CareIconProps {
  icon: IconName;
  className?: string | undefined;
  onClick?: React.MouseEventHandler<HTMLSpanElement> | undefined;
  id?: string;
}

/**
 * ### CARE's Official Icon Library.
 * @param className icon class name
 * @returns icon component
 * @example ```<CareIcon icon="l-hospital"/> ```
 *
 * @see [icon library](https://iconscout.com/unicons/)
 */
export default function CareIcon({
  id,
  icon,
  className,
  onClick,
}: CareIconProps) {
  const effectiveClassName = icon
    ? `care-${icon} ${className ?? ""}`
    : className;

  useEffect(() => transformIcons(), [effectiveClassName]);
  return (
    <i id={id} className={`care ${effectiveClassName}`} onClick={onClick} />
  );
}
