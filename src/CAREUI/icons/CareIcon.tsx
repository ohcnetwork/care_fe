import { useEffect } from "react";
import { transformIcons } from "./icon";

export interface CareIconProps {
  className?: string | undefined;
}

export default function CareIcon({ className }: CareIconProps) {
  useEffect(() => transformIcons(), [className]);
  return (
    <span key={className}>
      <i className={`care ${className}`} />
    </span>
  );
}
