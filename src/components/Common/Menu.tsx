import { Menu, MenuButton, MenuItem, MenuItems } from "@headlessui/react";
import { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { buttonVariants } from "@/components/ui/button";

import { useIsAuthorized } from "@/hooks/useIsAuthorized";

import { Anyone, AuthorizedElementProps } from "@/Utils/AuthorizeFor";
import { classNames } from "@/Utils/utils";

interface DropdownMenuProps {
  id?: string;
  title: string;
  icon?: JSX.Element | undefined;
  children: ReactNode | ReactNode[];
  disabled?: boolean | undefined;
  className?: string | undefined;
  itemClassName?: string | undefined;
  containerClassName?: string | undefined;
}

/**
 * @deprecated This component will be replaced with ShadCN's dropdown.
 */

export default function DropdownMenu({ ...props }: DropdownMenuProps) {
  return (
    <div
      id={props.id}
      className={classNames("text-right", props.containerClassName)}
    >
      <Menu as="div" className="relative inline-block w-full text-left">
        <MenuButton
          disabled={props.disabled}
          className={`inline-flex w-full cursor-pointer items-center justify-center gap-2 font-medium outline-offset-1 transition-all duration-200 ease-in-out disabled:cursor-not-allowed disabled:bg-secondary-200 disabled:text-secondary-500 lg:justify-between ${props.className} ${buttonVariants({ variant: "primary", size: "default" })}`}
        >
          <div className="flex items-center gap-2 whitespace-nowrap h-6">
            {props.icon}
            {props.title || "Dropdown"}
          </div>
          <CareIcon icon="l-angle-down" className="text-lg" />
        </MenuButton>

        <MenuItems
          modal={false}
          className={`absolute right-0 z-50 mt-2 min-w-full origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none sm:min-w-[250px] md:w-max ${props.itemClassName}`}
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
    icon?: ReactNode | undefined;
    disabled?: boolean | undefined;
  };

export function DropdownItem({
  authorizeFor = Anyone,
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
          `dropdown-item-primary`,
          isAuthorized ? "pointer-events-auto cursor-pointer" : "!hidden",
          className,
        )}
      >
        <i className="text-lg text-primary-500">{icon}</i>
        {children}
      </div>
    </MenuItem>
  );
}
