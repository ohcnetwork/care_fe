import { ChevronRight } from "lucide-react";
import { ActiveLink, usePath } from "raviger";
import { useState } from "react";
import React from "react";

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

import { NavigationLink } from "./facility-nav";

/* Converts a route pattern like '/path/:id' to a RegExp to match dynamic segments in URLs.
Helps in checking if the current path matches a pattern for active link detection. */
const matchPath = (pattern: string, path: string | null) => {
  const regex = new RegExp(`^${pattern.replace(/:\w+/g, "[^/]+")}(?:/|$)`);
  return regex.test(path || "");
};

const isChildActive = (link: NavigationLink, currentPath: string | null) => {
  if (!link.children) return false;
  return link.children.some(({ url, matchPaths = [] }) =>
    [url, ...matchPaths].some((pattern) => matchPath(pattern, currentPath)),
  );
};

const MultiActiveLink = ({
  href,
  matchPaths = [],
  children,
  activeClass = "",
  className = "",
  ...props
}: {
  href: string;
  matchPaths?: string[];
  children: React.ReactNode;
  activeClass?: string;
  className?: string;
  [key: string]: any;
}) => {
  const path = usePath();
  const isActive = [href, ...matchPaths].some((pattern) =>
    matchPath(pattern, path),
  );

  return (
    <ActiveLink
      href={href}
      className={cn(className, isActive && activeClass)}
      {...props}
    >
      {children}
    </ActiveLink>
  );
};

export function NavMain({ links }: { links: NavigationLink[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const path = usePath();
  const [open, setIsOpen] = useState<string | null>(null);

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links
          .filter((link) => link.visibility !== false)
          .map((link) => (
            <React.Fragment key={link.name}>
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu link={link} />
                ) : (
                  <Collapsible
                    asChild
                    open={open === link.name}
                    onOpenChange={(open) => setIsOpen(open ? link.name : null)}
                    className="group/collapsible"
                  >
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                          data-cy={`nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                          tooltip={link.name}
                          className={cn(
                            "cursor-pointer hover:bg-gray-200 hover:text-green-700",
                            {
                              "bg-white text-green-700 shadow":
                                open !== link.name && isChildActive(link, path),
                            },
                          )}
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
                          <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {link.children.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.name}>
                              <SidebarMenuSubButton
                                asChild
                                data-cy={`nav-${subItem.name.toLowerCase().replace(/\s+/g, "-")}`}
                                className={
                                  "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                                }
                              >
                                <MultiActiveLink
                                  href={subItem.url}
                                  matchPaths={subItem.matchPaths}
                                  className="w-full"
                                  activeClass="bg-white text-green-700 shadow"
                                >
                                  {subItem.name}
                                </MultiActiveLink>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                )
              ) : (
                <SidebarMenuItem key={link.name}>
                  <SidebarMenuButton
                    asChild
                    tooltip={link.name}
                    className={cn(
                      "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700",
                      {
                        "bg-white text-green-700 shadow": isChildActive(
                          link,
                          path,
                        ),
                      },
                    )}
                    data-cy={`nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <MultiActiveLink
                      href={link.url}
                      matchPaths={link.matchPaths}
                      className="w-full"
                      activeClass="bg-white text-green-700 shadow"
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
                    </MultiActiveLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </React.Fragment>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function PopoverMenu({ link }: { link: NavigationLink }) {
  const [open, setOpen] = useState(false);
  const path = usePath();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip={link.name}
          className={cn(
            "cursor-pointer hover:bg-gray-200 hover:text-green-700",
            {
              "bg-white text-green-700 shadow": isChildActive(link, path),
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
            <MultiActiveLink
              key={subItem.name}
              href={subItem.url}
              matchPaths={subItem.matchPaths}
              onClick={() => setOpen(false)}
              className="w-full rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
              activeClass="bg-gray-100 text-green-700"
              exactActiveClass="bg-gray-100 text-green-700"
            >
              {subItem.name}
            </MultiActiveLink>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
