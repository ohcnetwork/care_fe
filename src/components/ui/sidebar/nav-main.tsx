"use client";

import { ActiveLink } from "raviger";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";

import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

export function NavMain({
  links,
}: {
  links: {
    name: string;
    url: string;
    icon?: string;
  }[];
}) {
  const { isMobile, setOpenMobile } = useSidebar();

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
              onClick={() => {
                if (isMobile) {
                  setOpenMobile(false);
                }
              }}
            >
              <ActiveLink
                href={link.url}
                activeClass="bg-white text-green-700 shadow"
                exactActiveClass="bg-white text-green-700 shadow"
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
