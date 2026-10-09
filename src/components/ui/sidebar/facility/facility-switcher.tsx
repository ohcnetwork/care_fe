import {
  ChevronsUpDown,
  Hospital,
  LayoutDashboard,
  Search,
} from "lucide-react";
import { Link } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { cn } from "@/lib/utils";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/ui/sidebar";

import { FacilityBareMinimum } from "@/types/facility/facility";

export function FacilitySwitcher({
  facilities,
  selectedFacility,
}: {
  facilities: FacilityBareMinimum[];
  selectedFacility: FacilityBareMinimum | null;
}) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { handleMenuOpenChange } = useAppSidebar();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const filteredFacilities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return facilities;
    return facilities.filter((facility) =>
      facility.name.toLowerCase().includes(query),
    );
  }, [facilities, searchQuery]);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        handleMenuOpenChange(open);
        if (!open) setSearchQuery("");
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 max-w-full gap-2 rounded-lg border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-950 shadow-sm hover:bg-neutral-100 focus-visible:ring-indigo-400"
          aria-label={t("select_facility")}
        >
          {
            <>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-normal">
                  {selectedFacility?.name || t("select_facility")}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-neutral-500" />
            </>
          }
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg max-h-screen overflow-y-auto"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuItem asChild>
          <Link
            className="flex items-center gap-2 cursor-pointer"
            href="/"
            onClick={() => isMobile && setOpenMobile(false)}
          >
            <LayoutDashboard className="size-4" />
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
              placeholder={t("search_facilities")}
              aria-label={t("search_facilities")}
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
          filteredFacilities.map((facility) => (
            <DropdownMenuItem
              key={facility.id}
              asChild
              className={cn(
                "gap-2 p-2",
                facility.id === selectedFacility?.id &&
                  "bg-neutral-100 font-medium text-neutral-950 focus:bg-neutral-200 focus:text-neutral-950",
              )}
            >
              <Link
                href={`/facility/${facility.id}/overview`}
                aria-current={
                  facility.id === selectedFacility?.id ? "true" : undefined
                }
                onClick={() => {
                  setSearchQuery("");
                  if (isMobile) setOpenMobile(false);
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border border-neutral-200 shrink-0">
                  <Hospital className="size-4 shrink-0 text-current" />
                </div>
                {facility.name}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
