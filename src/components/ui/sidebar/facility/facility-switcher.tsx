import { CaretSortIcon, DashboardIcon } from "@radix-ui/react-icons";
import { Hospital, Search } from "lucide-react";
import { Link } from "raviger";
import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { FacilityBareMinimum } from "@/types/facility/facility";

export function FacilitySwitcher({
  facilities,
  selectedFacility,
}: {
  facilities: FacilityBareMinimum[];
  selectedFacility: FacilityBareMinimum | null;
}) {
  const { isMobile } = useSidebar();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFacilities = facilities.filter((facility) =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white"
              tooltip={selectedFacility?.name}
              aria-label={t("select_facility")}
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel>{t("facilities")}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {facilities.length > 1 && (
              <div className="relative p-1.5">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-3.5 text-gray-400" />
                <Input
                  placeholder={t("search_button")}
                  aria-label={t("search_button")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 sm:text-sm"
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                />
              </div>
            )}
            {filteredFacilities.length === 0 ? (
              <div className="px-2 py-4 text-center text-sm text-gray-500">
                {t("no_facilities_found")}
              </div>
            ) : (
              filteredFacilities.map((facility, index) => (
                <DropdownMenuItem
                  key={index}
                  asChild
                  className={cn(
                    "gap-2 p-2",
                    facility.id === selectedFacility?.id &&
                      "bg-primary-500 text-white focus:bg-primary-600 focus:text-white",
                  )}
                >
                  <Link href={`/facility/${facility.id}/overview`}>
                    <div className="flex size-6 items-center justify-center rounded-sm border border-gray-200 shrink-0">
                      <Hospital className="size-4 shrink-0 text-current" />
                    </div>
                    {facility.name}
                  </Link>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
