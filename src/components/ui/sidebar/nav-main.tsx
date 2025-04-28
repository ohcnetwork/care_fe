import { ChevronRight } from "lucide-react";
import { ActiveLink, usePath } from "raviger";
import { useState } from "react";

import { cn } from "@/lib/utils";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

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

const isChildActive = (link: NavigationLink, currentPath: string) => {
  if (!link.children) return false;

  if (
    link.matchPath &&
    link.matchPath.some((path) => currentPath.includes(path))
  ) {
    console.log(`Found match for ${link.name} at top-level`);
    return true;
  }

  return link.children.some((child) => {
    console.log("Checking child:", child.name);
    if (
      child.matchPath &&
      child.matchPath.some((path) => currentPath.includes(path))
    ) {
      console.log(`Found match for ${child.name} at child-level`);
      return true;
    }

    return currentPath.startsWith(child.url);
  });
};

export function NavMain({ links }: { links: NavigationLink[] }) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const currentPath = usePath() || "/";

  return (
    <SidebarGroup>
      <SidebarMenu>
        {links
          .filter((link) => link.visibility !== false)
          .map((link) => (
            <>
              {link.children ? (
                isCollapsed ? (
                  <PopoverMenu key={link.name} link={link} />
                ) : (
                  <Collapsible
                    key={link.name}
                    asChild
                    defaultOpen={isChildActive(link, currentPath)}
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
                              "bg-white text-green-700 shadow": isChildActive(
                                link,
                                currentPath,
                              ),
                            },
                          )}
                        >
                          {link.icon ? (
                            <CareIcon icon={link.icon as IconName} />
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
                                <ActiveLink
                                  href={subItem.url}
                                  className="w-full"
                                  activeClass="bg-white text-green-700 shadow"
                                  exactActiveClass="bg-white text-green-700 shadow"
                                >
                                  {subItem.name}
                                </ActiveLink>
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
                    className={
                      "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
                    }
                    data-cy={`nav-${link.name.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    <ActiveLink
                      href={link.url}
                      activeClass="bg-white text-green-700 shadow-sm"
                      exactActiveClass="bg-white text-green-700 shadow-sm"
                    >
                      {link.icon ? (
                        <CareIcon icon={link.icon as IconName} />
                      ) : (
                        <Avatar
                          name={link.name}
                          className="size-6 -m-1 rounded-sm"
                        />
                      )}

                      <span className="group-data-[collapsible=icon]:hidden ml-1">
                        {link.name}
                      </span>
                    </ActiveLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </>
          ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function PopoverMenu({ link }: { link: NavigationLink }) {
  const [open, setOpen] = useState(false);
  const currentPath = usePath() || "/";
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <SidebarMenuButton
          tooltip={link.name}
          className={cn("cursor-pointer", {
            "bg-white text-green-700 shadow": isChildActive(link, currentPath),
          })}
        >
          {link.icon ? (
            <CareIcon icon={link.icon as IconName} />
          ) : (
            <Avatar name={link.name} className="size-6 -m-1 rounded-sm" />
          )}
        </SidebarMenuButton>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" className="w-48 p-1">
        <div className="flex flex-col gap-1">
          {link.children?.map((subItem) => (
            <ActiveLink
              key={subItem.name}
              href={subItem.url}
              onClick={() => setOpen(false)}
              className="w-full rounded-md px-2 py-1.5 text-sm outline-none transition-colors hover:bg-gray-100 focus:bg-gray-100"
              activeClass="bg-gray-100 text-green-700"
              exactActiveClass="bg-gray-100 text-green-700"
            >
              {subItem.name}
            </ActiveLink>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
