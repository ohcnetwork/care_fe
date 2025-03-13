"use client";

import { ActiveLink } from "raviger";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { Avatar } from "@/components/Common/Avatar";

export function NavMain({
  links,
}: {
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarMenu>
        {links.map((link) => (
          <SidebarMenuItem key={link.name}>
            <SidebarMenuButton
              asChild
              tooltip={link.name}
              className={
                "text-gray-600 transition font-normal hover:bg-gray-200 hover:text-green-700"
              }
            >
              <ActiveLink
                href={link.url}
                activeClass="bg-white text-green-700 shadow"
                exactActiveClass="bg-white text-green-700 shadow"
              >
                {link.icon ? (
                  <CareIcon icon={link.icon as IconName} />
                ) : (
                  <Avatar
                    name={link.name}
                    className="w-6 h-6 -m-1 rounded-sm"
                  />
                )}

                <span className="group-data-[collapsible=icon]:hidden ml-1">
                  {link.name}
                </span>
              </ActiveLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
