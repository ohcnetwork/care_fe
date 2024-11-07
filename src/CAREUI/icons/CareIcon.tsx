import iconData from "@/CAREUI/icons/UniconPaths.json";
import "@/CAREUI/icons/icon.css";

export type IconName = keyof typeof iconData;

export interface CareIconProps {
  icon: IconName;
  className?: string;
  onClick?: React.MouseEventHandler<SVGSVGElement>;
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
  // TODO: fill & strokeWidth are defined for only one icon
  // Rethink Implementation
  const [viewBox, path, fill, strokeWidth] = iconData[icon] as [
    number,
    string,
    boolean | undefined,
    number | undefined,
  ];

  const svgClassName = `care-svg-icon__baseline ${className || ""}`.trim();

  return (
    <svg
      id={id}
      className={`care-${icon} ${svgClassName}`}
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      onClick={onClick}
      viewBox={`0 0 ${viewBox} ${viewBox}`}
    >
      <path
        d={path}
        fill={fill === false ? "none" : "currentColor"}
        stroke={fill === false ? "currentColor" : undefined}
        strokeWidth={fill === false ? strokeWidth : undefined}
      />
    </svg>
  );
}
