import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { ActiveLink, useFullPath, usePath } from "raviger";
import { forwardRef, Fragment, ReactNode, useMemo, useState } from "react";

import { navExpansionAtom } from "@/atoms/navExpansionAtom";
import { cn } from "@/lib/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

const isChildActive = (link: NavigationLink) => {
  if (!link.children) return false;
  const currentPath = window.location.pathname;
  return link.children.some((child) => currentPath.startsWith(child.url));
};

const useNavExpansionState = (linkName: string, link: NavigationLink) => {
  const [storedState, setStoredState] = useAtom(navExpansionAtom(linkName));

  // If no stored state, default to whether a child is active
  const isOpen = storedState ?? isChildActive(link);

  return [isOpen, setStoredState] as const;
};

export interface NavigationLink {
  header?: string;
  headerIcon?: ReactNode;
  name: string;
  url: string;
  icon?: ReactNode;
  visibility?: boolean;
  children?: NavigationLink[];
}

const NavLink = forwardRef<
  HTMLAnchorElement,
  {
    href: string;
    isSelected: boolean;
    activeClass?: string;
    exactActiveClass?: string;
    className?: string;
    onClick?: (e: React.MouseEvent) => void;
    children: ReactNode;
  }
>(function NavLink(
  {
    href,
    isSelected,
    activeClass,
    exactActiveClass,
    className,
    onClick,
    children,
  },
  ref,
) {
  const resolvedExact = exactActiveClass ?? activeClass;
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <ActiveLink
      ref={ref}
      href={href}
      className={className}
      activeClass={activeClass}
      exactActiveClass={resolvedExact}
      onClick={(e) => {
        if (isSelected) {
          e.preventDefault();
          if (isMobile) {
            toggleSidebar();
          }
        }
        onClick?.(e);
      }}
    >
      {children}
    </ActiveLink>
  );
});

export function NavMain({ links }: { links: NavigationLink[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const path = usePath();

  const fullPath = useFullPath();
  const fullPathMap = useMemo(
    () =>
      fullPath.split("/").reduce(
        (acc, part) => ({
          ...acc,
          [part]: true,
        }),
        {} as Record<string, boolean>,
      ),
    [fullPath],
  );

  const isSelected = (url: string) => {
    return path === url;
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links
          .filter((link) => link.visibility !== false)
          .map((link) => (
            <Fragment key={link.name}>
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu link={link} />
                ) : (
                  <CollapsibleNavItem
                    link={link}
                    fullPathMap={fullPathMap}
                    path={path}
                  />
                )
              ) : (
                <SidebarMenuItem>
                  <NavLink
                    href={link.url}
                    isSelected={isSelected(link.url)}
                    activeClass="bg-white text-green-700 shadow-sm"
                  >
                    <SidebarMenuButton
                      tooltip={link.name}
                      className={
                        "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                      }
                    >
                      {link.icon ? (
                        link.icon
                      ) : (
                        <Avatar
                          name={link.name}
                          className="size-6 -m-1 rounded-sm"
                        />
                      )}

                      <span className="group-data-[collapsible=icon]:hidden ml-1">
                        {link.name}
                      </span>
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              )}
            </Fragment>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function CollapsibleNavItem({
  link,
  fullPathMap: _fullPathMap,
  path,
}: {
  link: NavigationLink;
  fullPathMap: Record<string, boolean>;
  path: string | null;
}) {
  const [isOpen, handleOpenChange] = useNavExpansionState(link.name, link);

  const isSubItemSelected = (url: string) => path === url;

  return (
    <Collapsible
      asChild
      open={isOpen}
      onOpenChange={handleOpenChange}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={link.name}
            className="cursor-pointer hover:bg-gray-200 hover:text-green-700"
          >
            {link.icon ? (
              link.icon
            ) : (
              <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
            )}
            <span className="group-data-[collapsible=icon]:hidden ml-1">
              {link.name}
            </span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub className="border-l border-gray-300">
            {link.children
              ?.filter((link) => link.visibility !== false)
              .map((subItem) => (
                <Fragment key={subItem.name}>
                  {subItem.header && (
                    <div className="flex items-center gap-2 mt-2">
                      {subItem.headerIcon}
                      <span className="text-gray-400 uppercase text-xs font-bold">
                        {subItem.header}
                      </span>
                    </div>
                  )}
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      tooltip={subItem.name}
                      className={
                        "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                      }
                    >
                      <NavLink
                        href={subItem.url}
                        isSelected={isSubItemSelected(subItem.url)}
                        activeClass="bg-white text-green-700 shadow-sm"
                      >
                        {subItem.icon ? (
                          subItem.icon
                        ) : (
                          <Avatar
                            name={subItem.name}
                            className="size-6 -m-1 rounded-sm"
                          />
                        )}
                        <span className="group-data-[collapsible=icon]:hidden ml-1">
                          {subItem.name}
                        </span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Fragment>
              ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

function NavItem({
  item,
  setOpen,
}: {
  item: NavigationLink;
  setOpen: (open: boolean) => void;
}) {
  const path = usePath();
  const selected = path === item.url;

  return (
    <NavLink
      href={item.url}
      isSelected={selected}
      className="w-full rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
      activeClass="bg-gray-100 text-green-700"
      onClick={() => setOpen(false)}
    >
      {item.name}
    </NavLink>
  );
}

function PopoverMenu({ link }: { link: NavigationLink }) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip={link.name}
          className={cn(
            "cursor-pointer hover:bg-gray-200 hover:text-green-700",
            {
              "bg-white text-green-700 shadow": isChildActive(link),
            },
          )}
        >
          {link.icon ? (
            link.icon
          ) : (
            <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent
        side="right"
        align="start"
        className="w-48 p-1"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <div className="flex flex-col gap-1">
          {link.children?.map((subItem) => (
            <NavItem key={subItem.name} item={subItem} setOpen={setOpen} />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
