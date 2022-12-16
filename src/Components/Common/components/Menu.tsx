import { Menu } from "@headlessui/react";
import { ReactNode } from "react";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { useIsAuthorized } from "../../../Common/hooks/useIsAuthorized";
import { Anyone, AuthorizedElementProps } from "../../../Utils/AuthorizeFor";
import { classNames } from "../../../Utils/utils";
import { ButtonVariant } from "./ButtonV2";
import { DropdownTransition } from "./HelperComponents";

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
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button
          disabled={props.disabled}
          className={`flex w-full lg:justify-between justify-center items-center outline-offset-1 font-medium gap-2 transition-all duration-200 ease-in-out cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-500 button-${variant}-default button-size-default button-shape-square ${props.className}`}
        >
          <div className="flex gap-2 items-center h-6">
            {props.icon}
            {props.title}
          </div>
          <CareIcon className="ml-2 -mr-1 -mb-0.5 care-l-angle-down text-lg" />
        </Menu.Button>
        <DropdownTransition>
          <Menu.Items className="z-10 absolute right-0 mt-2 py-1 min-w-full sm:min-w-[250px] origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <>{props.children}</>
          </Menu.Items>
        </DropdownTransition>
      </Menu>
    </div>
  );
}

type RawDivProps = React.DetailedHTMLProps<
  React.HTMLAttributes<HTMLDivElement>,
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
          "rounded m-2 px-4 py-2 text-sm border-0 flex gap-3 items-center justify-start font-normal transition-all duration-200 ease-in-out",
          `dropdown-item-${variant}`,
          isAuthorized ? "pointer-events-auto cursor-pointer" : "!hidden",
          className
        )}
      >
        <i className={`text-lg text-${variant}-500`}>{icon}</i>
        {children}
      </div>
    </Menu.Item>
  );
}
