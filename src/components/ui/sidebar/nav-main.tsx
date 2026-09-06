import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { ActiveLink, useFullPath, usePath } from "raviger";
import { Fragment, ReactNode, useEffect, useMemo, useState } from "react";

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
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

type NavAppearance = "default" | "careui";

const CAREUI_NAV_CLASSES =
  "relative h-10 rounded-[8px] px-2.5 py-2 text-base font-normal text-neutral-950 hover:bg-neutral-200 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-indigo-400 data-[state=open]:hover:bg-neutral-200 data-[state=open]:hover:text-neutral-950 data-[active=true]:bg-white data-[active=true]:font-medium data-[active=true]:text-emerald-800 data-[active=true]:shadow data-[active=true]:ring-1 data-[active=true]:ring-emerald-800/20 data-[active=true]:hover:bg-white data-[active=true]:hover:text-emerald-800 data-[active=true]:focus-visible:ring-2 data-[active=true]:focus-visible:ring-indigo-400 data-[active=true]:after:absolute data-[active=true]:after:right-0 data-[active=true]:after:top-1/2 data-[active=true]:after:h-6 data-[active=true]:after:w-1 data-[active=true]:after:-translate-y-1/2 data-[active=true]:after:rounded-l-full data-[active=true]:after:bg-emerald-600 data-[active=true]:after:content-[''] md:text-sm";

const isNavigationActive = (path: string | null, url: string) => {
  const currentPath = path?.split(/[?#]/)[0].replace(/\/+$/, "");
  const targetPath = url.replace(/\/+$/, "");
  return (
    currentPath === targetPath ||
    currentPath?.startsWith(`${targetPath}/`) === true
  );
};

const isChildActive = (link: NavigationLink) => {
  if (!link.children) return false;
  const currentPath = window.location.pathname;
  return link.children.some((child) => currentPath.startsWith(child.url));
};

const useNavExpansionState = (
  linkName: string,
  link: NavigationLink,
  childActive = isChildActive(link),
) => {
  const [storedState, setStoredState] = useAtom(navExpansionAtom(linkName));

  // If no stored state, default to whether a child is active
  const isOpen = storedState ?? childActive;

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

function NavLink({
  href,
  ariaLabel,
  isSelected,
  isActive,
  activeClass,
  exactActiveClass,
  className,
  onClick,
  children,
}: {
  href: string;
  ariaLabel?: string;
  isSelected: boolean;
  isActive?: boolean;
  activeClass?: string;
  exactActiveClass?: string;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  children: ReactNode;
}) {
  const resolvedExact = exactActiveClass ?? activeClass;
  const { toggleSidebar, isMobile } = useSidebar();

  return (
    <ActiveLink
      href={href}
      aria-label={ariaLabel}
      basePath={isActive !== undefined ? "/" : undefined}
      aria-current={isActive ? "page" : undefined}
      data-active={isActive}
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
}

export function NavMain({
  links,
  label,
  appearance = "default",
}: {
  links: NavigationLink[];
  label?: string;
  appearance?: NavAppearance;
}) {
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

  const isCareUI = appearance === "careui";

  return (
    <SidebarGroup className={cn(isCareUI && "gap-0.5 py-2")}>
      {label && (
        <SidebarGroupLabel
          className={cn(isCareUI && "font-medium text-neutral-600 uppercase")}
        >
          {label}
        </SidebarGroupLabel>
      )}
      <SidebarMenu className={cn(isCareUI && "gap-0.5")}>
        {links
          .filter((link) => link.visibility !== false)
          .map((link) => (
            <Fragment key={link.name}>
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu link={link} appearance={appearance} />
                ) : (
                  <CollapsibleNavItem
                    link={link}
                    fullPathMap={fullPathMap}
                    path={path}
                    appearance={appearance}
                  />
                )
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={link.name}
                    isActive={isCareUI && isNavigationActive(path, link.url)}
                    className={
                      isCareUI
                        ? CAREUI_NAV_CLASSES
                        : "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                    }
                  >
                    <NavLink
                      href={link.url}
                      ariaLabel={isCareUI ? link.name : undefined}
                      isSelected={isSelected(link.url)}
                      isActive={
                        isCareUI
                          ? isNavigationActive(path, link.url)
                          : undefined
                      }
                      activeClass={
                        isCareUI
                          ? undefined
                          : "bg-white text-green-700 shadow-sm"
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

                      <span
                        className={cn(
                          "group-data-[collapsible=icon]:hidden",
                          !isCareUI && "ml-1",
                        )}
                      >
                        {link.name}
                      </span>
                    </NavLink>
                  </SidebarMenuButton>
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
  fullPathMap,
  path,
  appearance,
}: {
  link: NavigationLink;
  fullPathMap: Record<string, boolean>;
  path: string | null;
  appearance: NavAppearance;
}) {
  const isCareUI = appearance === "careui";
  const childActive = isCareUI
    ? !!link.children?.some(
        (child) =>
          child.visibility !== false && isNavigationActive(path, child.url),
      )
    : isChildActive(link);
  const [isOpen, handleOpenChange] = useNavExpansionState(
    link.name,
    link,
    childActive,
  );

  useEffect(() => {
    if (isCareUI && childActive) handleOpenChange(true);
  }, [path, isCareUI, childActive, handleOpenChange]);

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
            isActive={isCareUI && childActive && !isOpen}
            className={cn(
              isCareUI
                ? CAREUI_NAV_CLASSES
                : "cursor-pointer hover:bg-gray-200 hover:text-green-700",
              isCareUI &&
                childActive &&
                isOpen &&
                "font-medium text-emerald-800",
            )}
          >
            {link.icon ? (
              link.icon
            ) : (
              <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
            )}
            <span
              className={cn(
                "group-data-[collapsible=icon]:hidden",
                !isCareUI && "ml-1",
              )}
            >
              {link.name}
            </span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub
            className={cn(
              "border-l",
              isCareUI ? "gap-0.5 border-neutral-300" : "border-gray-300",
            )}
          >
            {link.children
              ?.filter((link) => link.visibility !== false)
              .map((subItem) => (
                <Fragment key={subItem.name}>
                  {subItem.header && (
                    <div className="flex items-center gap-2 mt-2">
                      {subItem.headerIcon}
                      <span
                        className={cn(
                          "text-xs uppercase",
                          isCareUI
                            ? "font-medium text-neutral-600"
                            : "font-bold text-gray-400",
                        )}
                      >
                        {subItem.header}
                      </span>
                    </div>
                  )}
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      isActive={
                        isCareUI && isNavigationActive(path, subItem.url)
                      }
                      className={
                        isCareUI
                          ? CAREUI_NAV_CLASSES
                          : "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                      }
                    >
                      <NavLink
                        href={subItem.url}
                        isSelected={isSubItemSelected(subItem.url)}
                        isActive={
                          isCareUI
                            ? isNavigationActive(path, subItem.url)
                            : undefined
                        }
                        className="w-full"
                        activeClass={
                          isCareUI
                            ? undefined
                            : cn(
                                subItem.url
                                  .split("/")
                                  .every((part) => fullPathMap[part]) &&
                                  "bg-white text-green-700 shadow",
                              )
                        }
                        exactActiveClass={
                          isCareUI
                            ? undefined
                            : "bg-white text-green-700 shadow"
                        }
                      >
                        {isCareUI ? (
                          <span className="truncate" title={subItem.name}>
                            {subItem.name}
                          </span>
                        ) : (
                          subItem.name
                        )}
                      </NavLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
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
  appearance,
}: {
  item: NavigationLink;
  setOpen: (open: boolean) => void;
  appearance: NavAppearance;
}) {
  const path = usePath();
  const selected = path === item.url;
  const isCareUI = appearance === "careui";

  return (
    <NavLink
      href={item.url}
      isSelected={selected}
      isActive={isCareUI ? isNavigationActive(path, item.url) : undefined}
      className={cn(
        "w-full",
        isCareUI
          ? CAREUI_NAV_CLASSES
          : "rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
      )}
      activeClass={isCareUI ? undefined : "bg-gray-100 text-green-700"}
      onClick={() => setOpen(false)}
    >
      {item.name}
    </NavLink>
  );
}

function PopoverMenu({
  link,
  appearance,
}: {
  link: NavigationLink;
  appearance: NavAppearance;
}) {
  const [open, setOpen] = useState(false);
  const path = usePath();
  const isCareUI = appearance === "careui";
  const childActive = isCareUI
    ? !!link.children?.some(
        (child) =>
          child.visibility !== false && isNavigationActive(path, child.url),
      )
    : isChildActive(link);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          aria-label={isCareUI ? link.name : undefined}
          tooltip={link.name}
          isActive={isCareUI && childActive}
          className={cn(
            isCareUI
              ? CAREUI_NAV_CLASSES
              : "cursor-pointer hover:bg-gray-200 hover:text-green-700",
            {
              "bg-white text-green-700 shadow": !isCareUI && childActive,
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
        className={cn(
          "w-48 p-1",
          isCareUI &&
            "w-60 rounded-xl border-neutral-200 bg-white text-neutral-950 shadow-md",
        )}
        aria-label={isCareUI ? link.name : undefined}
        onCloseAutoFocus={isCareUI ? undefined : (e) => e.preventDefault()}
      >
        <div className={cn("flex flex-col", isCareUI ? "gap-0.5" : "gap-1")}>
          {link.children
            ?.filter((item) => !isCareUI || item.visibility !== false)
            .map((subItem) => (
              <NavItem
                key={subItem.name}
                item={subItem}
                setOpen={setOpen}
                appearance={appearance}
              />
            ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
