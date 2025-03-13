import { CaretSortIcon, DashboardIcon } from "@radix-ui/react-icons";
import { Hospital } from "lucide-react";
import { navigate } from "raviger";
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

import { UserFacilityModel } from "@/components/Users/models";

export function FacilitySwitcher({
  facilities,
  selectedFacility,
}: {
  facilities: UserFacilityModel[];
  selectedFacility: UserFacilityModel | null;
}) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation();

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white"
              tooltip={selectedFacility?.name}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                <Hospital className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                  {selectedFacility?.name || t("select_facility")}
                </span>
              </div>
              <CaretSortIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg max-h-screen overflow-y-auto"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuItem onClick={() => navigate("/")}>
              <DashboardIcon className="size-4" />
              {t("view_dashboard")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("facilities")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facilities.map((facility, index) => (
              <DropdownMenuItem
                key={index}
                onClick={() => {
                  navigate(`/facility/${facility.id}/overview`);
                }}
                className={cn(
                  "gap-2 p-2",
                  facility.name === selectedFacility?.name &&
                    "bg-primary-500 text-white focus:bg-primary-600 focus:text-white",
                )}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <Hospital className="size-4 shrink-0" />
                </div>
                {facility.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
