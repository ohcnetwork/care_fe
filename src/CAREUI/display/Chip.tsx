import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import { ButtonVariant } from "@/components/Common/ButtonV2";

import { classNames } from "@/Utils/utils";

interface Props {
  size?: "small" | "medium" | "large";
  hideBorder?: boolean;
  variant?: ButtonVariant | "custom";
  startIcon?: IconName;
  endIcon?: IconName;
  text: string;
  tooltip?: string;
  className?: string;
  id?: string;
}

export default function Chip({
  size = "medium",
  hideBorder = false,
  variant = "primary",
  ...props
}: Props) {
  return (
    <span
      id={props?.id}
      className={classNames(
        "inline-flex items-center gap-2 font-medium leading-4",

        {
          small: "rounded px-2 py-1 text-xs",
          medium: "rounded-lg px-3 py-2 text-xs",
          large: "rounded-lg px-4 py-3 text-sm",
        }[size],

        !hideBorder && "border",
        {
          primary: "border-primary-300 bg-primary-100 text-primary-900",
          secondary: "border-secondary-300 bg-secondary-100 text-secondary-900",
          success: "border-success-300 bg-success-100 text-success-900",
          danger: "border-danger-300 bg-danger-100 text-danger-900",
          warning: "border-warning-300 bg-warning-100 text-warning-900",
          alert: "border-alert-300 bg-alert-100 text-alert-900",
          custom: "",
        }[variant],

        props.className,
      )}
      title={props.tooltip}
    >
      {props.startIcon && <CareIcon icon={props.startIcon} />}
      <span>{props.text}</span>
      {props.endIcon && <CareIcon icon={props.endIcon} />}
    </span>
  );
}
