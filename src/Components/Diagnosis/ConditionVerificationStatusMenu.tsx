import { useTranslation } from "react-i18next";
import CareIcon from "../../CAREUI/icons/CareIcon";
import DropdownMenu, { DropdownItem } from "../Common/components/Menu";
import { ConditionVerificationStatus } from "./types";

interface Props<T extends ConditionVerificationStatus> {
  disabled?: boolean;
  value?: T;
  placeholder?: string;
  options: readonly T[];
  onSelect: (option: T) => void;
  onRemove?: () => void;
  className?: string;
}

export default function ConditionVerificationStatusMenu<
  T extends ConditionVerificationStatus
>(props: Props<T>) {
  const { t } = useTranslation();

  return (
    <DropdownMenu
      className={props.className}
      id="condition-verification-status-menu"
      title={props.value ? t(props.value) : props.placeholder ?? t("add")}
      icon={
        props.value ? (
          <CareIcon icon={StatusStyle[props.value].icon} className="text-lg" />
        ) : (
          <CareIcon icon="l-plus-circle" className="text-lg" />
        )
      }
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
              <CareIcon icon={StatusStyle[status].icon} className="text-lg" />
            }
            disabled={props.value === status}
          >
            <span className={props.value === status ? "font-medium" : ""}>
              {t(status)}
            </span>
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

const StatusStyle = {
  unconfirmed: { variant: "warning", icon: "l-question" },
  provisional: { variant: "warning", icon: "l-question" },
  differential: { variant: "warning", icon: "l-question" },
  confirmed: { variant: "primary", icon: "l-check" },
  refuted: { variant: "danger", icon: "l-times" },
  "entered-in-error": { variant: "danger", icon: "l-ban" },
} as const;
