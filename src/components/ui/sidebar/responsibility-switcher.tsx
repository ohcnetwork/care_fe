import { CaretSortIcon, DashboardIcon } from "@radix-ui/react-icons";
import { ShieldCheck } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavMain } from "@/components/ui/sidebar/nav-main";

import { useAccessibleRoleOrganizationsList } from "@/hooks/useAccessibleRoleOrganizationsList";

interface Props {
  selectedResponsibilityId: string;
}

export function ResponsibilitySwitcher({ selectedResponsibilityId }: Props) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation();

  const { data } = useAccessibleRoleOrganizationsList();

  const items = data?.results || [];
  const selectedItem = items.find(
    (item) => item.organization.id === selectedResponsibilityId,
  );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white"
              tooltip={t("responsibilities")}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                <ShieldCheck className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedItem?.organization.name || t("responsibilities")}
                </span>
                {selectedItem?.role && (
                  <span className="truncate text-xs text-gray-500">
                    {selectedItem.role.name}
                  </span>
                )}
              </div>
              <CaretSortIcon className="ml-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg max-h-screen overflow-y-auto"
        align="start"
        side={isMobile ? "bottom" : "right"}
        sideOffset={4}
      >
        <DropdownMenuItem asChild>
          <Link className="flex items-center gap-2 cursor-pointer" href="/">
            <DashboardIcon className="size-4" />
            {t("view_dashboard")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuLabel>{t("responsibilities")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.organization.id}
            asChild
            className={cn(
              "gap-2 p-2",
              item.organization.id === selectedResponsibilityId &&
                "bg-primary-500 text-white focus:bg-primary-600 focus:text-white",
            )}
          >
            <Link href={`/responsibilities/${item.organization.id}`}>
              <div className="flex flex-col">
                <span>{item.organization.name}</span>
                {item.role && (
                  <span className="text-xs opacity-70">{item.role.name}</span>
                )}
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ResponsibilityNav() {
  const { data } = useAccessibleRoleOrganizationsList();

  const items = data?.results || [];

  return (
    <NavMain
      links={items.map((item) => ({
        name: item.organization.name,
        url: `/responsibilities/${item.organization.id}`,
      }))}
    />
  );
}
