import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { ButtonSize, ButtonVariant } from "@/components/Common/ButtonV2";

import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import { Anyone, AuthorizedElementProps } from "@/Utils/AuthorizeFor";
import { classNames } from "@/Utils/utils";

interface DropdownMenuProps {
  id?: string;
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: JSX.Element | undefined;
  children: ReactNode | ReactNode[];
  disabled?: boolean | undefined;
  className?: string | undefined;
  itemClassName?: string | undefined;
  containerClassName?: string | undefined;
}

export default function DropdownMenu({
  variant = "primary",
  size = "default",
  ...props
}: DropdownMenuProps) {
  return (
    <div
      id={props.id}
      className={classNames("text-right", props.containerClassName)}
    >
      <Menu as="div" className="relative inline-block w-full text-left">
        <MenuButton
          disabled={props.disabled}
          className={`button-size-${size} button-${variant}-default button-shape-square flex w-full cursor-pointer items-center justify-center gap-2 font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500 lg:justify-between ${props.className}`}
        >
          <div
            className={classNames(
              "flex items-center gap-2 whitespace-nowrap",
              size === "small" ? "h-5" : "h-6",
            )}
          >
            {props.icon}
            {props.title || "Dropdown"}
          </div>
          <CareIcon
            icon="l-angle-down"
            className={size === "small" ? "text-base" : "text-lg"}
          />
        </MenuButton>

        <MenuItems
          modal={false}
          className={`absolute right-0 z-10 mt-2 min-w-full origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:min-w-[250px] md:w-max ${props.itemClassName}`}
        >
          <>{props.children}</>
        </MenuItems>
      </Menu>
    </div>
  );
}

type RawDivProps = DetailedHTMLProps<
  HTMLAttributes<HTMLDivElement>,
  HTMLDivElement
>;

export type DropdownItemProps = RawDivProps &
  AuthorizedElementProps & {
    variant?: ButtonVariant;
    icon?: ReactNode | undefined;
    disabled?: boolean | undefined;
  };

export function DropdownItem({
  authorizeFor = Anyone,
  variant = "primary",
  className,
  icon,
  children,
  ...props
}: DropdownItemProps) {
  const isAuthorized = useIsAuthorized(authorizeFor);

  return (
    <MenuItem as="div" disabled={props.disabled}>
      <div
        {...props}
        className={classNames(
          "m-2 flex items-center justify-start gap-3 rounded border-0 px-4 py-2 text-sm font-normal transition-all duration-200 ease-in-out",
          `dropdown-item-${variant}`,
          isAuthorized ? "pointer-events-auto cursor-pointer" : "!hidden",
          className,
        )}
      >
        <i
          className={classNames(
            "text-lg",
            {
              primary: "text-primary-500",
              secondary: "text-secondary-500",
              success: "text-success-500",
              warning: "text-warning-500",
              danger: "text-danger-500",
              alert: "text-alert-500",
            }[variant],
          )}
        >
          {icon}
        </i>
        {children}
      </div>
    </MenuItem>
  );
}
