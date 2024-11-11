import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { ButtonSize } from "@/components/Common/ButtonV2";
import DropdownMenu, { DropdownItem } from "@/components/Common/Menu";
import {
  ConditionVerificationStatus,
  InactiveConditionVerificationStatuses,
} from "@/components/Diagnosis/types";

import { classNames } from "@/Utils/utils";

interface Props<T extends ConditionVerificationStatus> {
  disabled?: boolean;
  value?: T;
  placeholder?: string;
  options: readonly T[];
  onSelect: (option: T) => void;
  onRemove?: () => void;
  className?: string;
  size?: ButtonSize;
}

export default function ConditionVerificationStatusMenu<
  T extends ConditionVerificationStatus,
>(props: Props<T>) {
  const { t } = useTranslation();

  return (
    <DropdownMenu
      size={props.size ?? "small"}
      className={classNames(
        props.className,
        props.value && StatusStyle[props.value].colors,
        props.value &&
          "border !border-secondary-400 bg-white hover:bg-secondary-300",
      )}
      id="condition-verification-status-menu"
      title={props.value ? t(props.value) : (props.placeholder ?? t("add_as"))}
      disabled={props.disabled}
      variant={props.value ? StatusStyle[props.value].variant : "primary"}
    >
      <>
        {props.options.map((status) => (
          <DropdownItem
            key={status}
            id={`add-icd11-diagnosis-as-${status}`}
            variant={StatusStyle[status].variant}
            onClick={() => props.onSelect(status)}
            icon={
              <CareIcon
                icon="l-coronavirus"
                className={classNames(
                  "hidden text-lg transition-all duration-200 ease-in-out group-hover:rotate-90 group-hover:text-inherit md:block",
                  props.value === status
                    ? "text-inherit-500"
                    : "text-secondary-500",
                )}
              />
            }
            className="group"
            disabled={props.value === status}
          >
            <div className="flex w-full max-w-xs flex-col items-start gap-1 whitespace-nowrap md:whitespace-normal">
              <span className={props.value === status ? "font-medium" : ""}>
                {InactiveConditionVerificationStatuses.includes(
                  status as (typeof InactiveConditionVerificationStatuses)[number],
                )
                  ? "Remove as "
                  : ""}
                {t(status)}
              </span>
              <span className="hidden text-xs text-secondary-600 md:block">
                {t(`help_${status}`)}
              </span>
            </div>
          </DropdownItem>
        ))}

        {props.value && props.onRemove && (
          <DropdownItem
            variant="danger"
            id="remove-diagnosis"
            onClick={() => props.onRemove?.()}
            icon={<CareIcon icon="l-trash-alt" className="text-lg" />}
          >
            {t("remove")}
          </DropdownItem>
        )}
      </>
    </DropdownMenu>
  );
}

export const StatusStyle = {
  unconfirmed: {
    variant: "warning",
    // icon: "l-question",
    colors: "text-yellow-500 border-yellow-500",
  },
  provisional: {
    variant: "warning",
    // icon: "l-question",
    colors: "text-secondary-800 border-secondary-800",
  },
  differential: {
    variant: "warning",
    // icon: "l-question",
    colors: "text-secondary-800 border-secondary-800",
  },
  confirmed: {
    variant: "primary",
    // icon: "l-check",
    colors: "text-primary-500 border-primary-500",
  },
  refuted: {
    variant: "danger",
    icon: "l-times",
    colors: "text-danger-500 border-danger-500",
  },
  "entered-in-error": {
    variant: "danger",
    // icon: "l-ban",
    colors: "text-danger-500 border-danger-500",
  },
} as const;
