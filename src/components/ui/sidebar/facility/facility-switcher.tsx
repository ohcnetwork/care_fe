import { Check, ChevronsUpDown, LayoutDashboard, Search } from "lucide-react";
import { Link } from "raviger";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";

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
          className="max-w-full gap-2 font-normal shadow-sm"
          aria-label={selectedFacility?.name || t("select_facility")}
        >
          <span className="truncate">
            {selectedFacility?.name || t("select_facility")}
          </span>
          <ChevronsUpDown className="ml-auto size-3.5 shrink-0 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-(--anchor-width) min-w-56"
        align="start"
        side="bottom"
        sideOffset={4}
      >
        <DropdownMenuItem asChild>
          <Link
            className="gap-2"
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
          <div className="p-1.5">
            <InputGroup className="h-9">
              <InputGroupInput
                placeholder={t("search_facilities")}
                aria-label={t("search_facilities")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-full"
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
              />
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
            </InputGroup>
          </div>
        )}
        {filteredFacilities.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            {t("no_facilities_found")}
          </div>
        ) : (
          filteredFacilities.map((facility) => (
            <DropdownMenuItem key={facility.id} asChild className="gap-2">
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
                {facility.id === selectedFacility?.id ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden="true" />
                )}
                {facility.name}
              </Link>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
