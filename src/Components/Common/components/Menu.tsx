import { Anyone, AuthorizedElementProps } from "../../../Utils/AuthorizeFor";

import { ButtonVariant } from "./ButtonV2";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { DropdownTransition } from "./HelperComponents";
import { Menu } from "@headlessui/react";
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import { classNames } from "../../../Utils/utils";
import { useIsAuthorized } from "../../../Common/hooks/useIsAuthorized";

interface DropdownMenuProps {
  id?: string;
  title: string;
  variant?: ButtonVariant;
  icon?: JSX.Element | undefined;
  children: JSX.Element | JSX.Element[];
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export default function DropdownMenu({
  variant = "primary",
  ...props
}: DropdownMenuProps) {
  return (
    <div id={props.id} className="text-right">
      <Menu as="div" className="relative inline-block w-full text-left">
        <Menu.Button
          disabled={props.disabled}
          className={`button-size-default button-${variant}-default  button-shape-square flex w-full cursor-pointer items-center justify-center gap-2 font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 lg:justify-between ${props.className}`}
        >
          <div className="flex h-6 items-center gap-2">
            {props.icon}
            {props.title || "Dropdown"}
          </div>
          <CareIcon className="care-l-angle-down -mr-1 ml-2 text-lg" />
        </Menu.Button>
        <DropdownTransition>
          <Menu.Items className="absolute right-0 z-10 mt-2 min-w-full origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:min-w-[250px] md:w-max">
            <>{props.children}</>
          </Menu.Items>
        </DropdownTransition>
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
    <Menu.Item as="div" disabled={props.disabled}>
      <div
        {...props}
        className={classNames(
          "m-2 flex items-center justify-start gap-3 rounded border-0 px-4 py-2 text-sm font-normal transition-all duration-200 ease-in-out",
          `dropdown-item-${variant}`,
          isAuthorized ? "pointer-events-auto cursor-pointer" : "!hidden",
          className
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
            }[variant]
          )}
        >
          {icon}
        </i>
        {children}
      </div>
    </Menu.Item>
  );
}
