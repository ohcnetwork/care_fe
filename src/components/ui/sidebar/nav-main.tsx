"use client";

import { ActiveLink } from "raviger";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import useActiveLink from "@/hooks/useActiveLink";

export function NavMain({
  links,
}: {
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}) {
  const activePath = useActiveLink();

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
                className={
                  link.url.endsWith(activePath!) ||
                  link.name.toLowerCase() === activePath!.split("/")[1]
                    ? "bg-white text-green-700 shadow"
                    : ""
                }
              >
                {link.icon && <CareIcon icon={link.icon as IconName} />}
                <span className="group-data-[collapsible=icon]:hidden">
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
