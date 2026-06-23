import { t } from "i18next";
import { useAtom } from "jotai";
import { ChevronRight } from "lucide-react";
import { ActiveLink, useFullPath } from "raviger";
import { Fragment, ReactNode, useMemo, useState } from "react";

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
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

import { isSafeExternalUrl, isSafeNavUrl } from "@/Utils/url";

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
  openInNewTab?: boolean; // Open in a new tab; defaults to true for absolute http(s) URLs.
  children?: NavigationLink[];
}

const isRenderableNavLink = (link: NavigationLink) => isSafeNavUrl(link.url);

/**
 * Renders a nav destination as a raviger `ActiveLink` (internal, same-tab) or a
 * plain anchor (absolute http(s) URLs, or links opening in a new tab). Returns a
 * DOM element directly so it can be used as the child of an `asChild` button.
 */
function renderNavLink(
  link: NavigationLink,
  children: ReactNode,
  opts: {
    className?: string;
    activeClass?: string;
    exactActiveClass?: string;
    onClick?: () => void;
  } = {},
) {
  const isExternal = isSafeExternalUrl(link.url);
  if (isExternal || link.openInNewTab) {
    const openInNewTab = link.openInNewTab ?? isExternal;
    return (
      <a
        href={link.url}
        onClick={opts.onClick}
        className={opts.className}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
      >
        {children}
        {openInNewTab && (
          <span className="sr-only">{t("opens_in_new_tab")}</span>
        )}
      </a>
    );
  }

  return (
    <ActiveLink
      href={link.url}
      onClick={opts.onClick}
      className={opts.className}
      activeClass={opts.activeClass}
      exactActiveClass={opts.exactActiveClass}
    >
      {children}
    </ActiveLink>
  );
}

export function NavMain({ links }: { links: NavigationLink[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

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

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links
          .filter((link) => link.visibility !== false)
          .filter(isRenderableNavLink)
          .map((link) => (
            <Fragment key={link.name}>
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu link={link} />
                ) : (
                  <CollapsibleNavItem link={link} fullPathMap={fullPathMap} />
                )
              ) : (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    tooltip={link.name}
                    className={
                      "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                    }
                  >
                    {renderNavLink(
                      link,
                      <>
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
                      </>,
                      {
                        activeClass: "bg-white text-green-700 shadow-sm",
                        exactActiveClass: "bg-white text-green-700 shadow-sm",
                      },
                    )}
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
}: {
  link: NavigationLink;
  fullPathMap: Record<string, boolean>;
}) {
  const [isOpen, handleOpenChange] = useNavExpansionState(link.name, link);

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
              .filter(isRenderableNavLink)
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
                  <SidebarMenuSubItem>
                    <SidebarMenuSubButton
                      asChild
                      className={
                        "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                      }
                    >
                      {renderNavLink(subItem, subItem.name, {
                        className: "w-full",
                        activeClass: cn(
                          subItem.url
                            .split("/")
                            .every((part) => fullPathMap[part]) &&
                            "bg-white text-green-700 shadow",
                        ),
                        exactActiveClass: "bg-white text-green-700 shadow",
                      })}
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
          {link.children?.filter(isRenderableNavLink).map((subItem) => (
            <Fragment key={subItem.name}>
              {renderNavLink(subItem, subItem.name, {
                className:
                  "w-full rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100",
                activeClass: "bg-gray-100 text-green-700",
                exactActiveClass: "bg-gray-100 text-green-700",
                onClick: () => setOpen(false),
              })}
            </Fragment>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
