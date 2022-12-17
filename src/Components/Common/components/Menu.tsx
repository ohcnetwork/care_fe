import { Menu } from "@headlessui/react";
import { ReactNode } from "react";
import CareIcon from "../../../CAREUI/icons/CareIcon";
import { useIsAuthorized } from "../../../Common/hooks/useIsAuthorized";
import { Anyone, AuthorizedElementProps } from "../../../Utils/AuthorizeFor";
import { ButtonVariant } from "./ButtonV2";
import { DropdownTransition } from "./HelperComponents";

export default function DropdownMenu(props: {
  id?: string;
  title: string;
  icon: JSX.Element;
  children: JSX.Element | JSX.Element[];
}) {
  return (
    <div id={props.id} className="text-right">
      <Menu as="div" className="relative inline-block text-left w-full">
        <Menu.Button className="text-white flex w-full lg:justify-between justify-center items-center outline-offset-1 Button button-primary-default button-size-default button-shape-square">
          <div className="flex gap-2 items-center">
            {props.icon}
            {props.title}
          </div>

          <CareIcon className="ml-2 -mr-1 care-l-angle-down h-6" />
        </Menu.Button>
        <DropdownTransition>
          <Menu.Items className="absolute right-0 mt-2 py-1 min-w-full sm:min-w-[250px] origin-top-right rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
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
    <Menu.Item as="div">
      <div
        {...props}
        className={[
          `dropdown-item dropdown-item-${variant}`,
          isAuthorized ? "pointer-events-auto cursor-pointer" : "!hidden",
          className,
        ].join(" ")}
      >
        <i className={`text-lg text-${variant}-500`}>{icon}</i>
        {children}
      </div>
    </Menu.Item>
  );
}
