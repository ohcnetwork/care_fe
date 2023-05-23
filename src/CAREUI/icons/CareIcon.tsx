import { transformIcons } from "./icon";
import { useEffect } from "react";

export interface CareIconProps {
  className?: string | undefined;
  onClick?: () => void;
}

export default function CareIcon({ className, onClick }: CareIconProps) {
  useEffect(() => transformIcons(), [className]);
  return (
    <span onClick={onClick} key={className}>
      <i className={`care ${className}`} />
    </span>
  );
}
