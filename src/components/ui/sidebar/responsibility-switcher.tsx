import { ChevronsUpDown, LayoutDashboard } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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
import { NavMain } from "@/components/ui/sidebar/nav-main";

import { useAccessibleRoleOrganizationsList } from "@/hooks/useAccessibleRoleOrganizationsList";

interface Props {
  selectedResponsibilityId: string;
}

export function ResponsibilitySwitcher({ selectedResponsibilityId }: Props) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { handleMenuOpenChange } = useAppSidebar();
  const { t } = useTranslation();

  const { data } = useAccessibleRoleOrganizationsList();

  const items = data?.results || [];
  const selectedItem = items.find(
    (item) => item.organization.id === selectedResponsibilityId,
  );

  return (
    <DropdownMenu onOpenChange={handleMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 max-w-full gap-2 rounded-lg border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-950 shadow-sm hover:bg-neutral-100 focus-visible:ring-indigo-400"
          aria-label={selectedItem?.organization.name || t("responsibilities")}
        >
          {
            <>
              <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                <span className="truncate font-normal">
                  {selectedItem?.organization.name || t("responsibilities")}
                </span>
                {selectedItem?.role && (
                  <span className="truncate text-xs text-neutral-600">
                    {selectedItem.role.name}
                  </span>
                )}
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
        <DropdownMenuLabel>{t("responsibilities")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.organization.id}
            asChild
            className={cn(
              "gap-2 p-2",
              item.organization.id === selectedResponsibilityId &&
                "bg-neutral-100 font-medium text-neutral-950 focus:bg-neutral-200 focus:text-neutral-950",
            )}
          >
            <Link
              href={`/responsibilities/${item.organization.id}`}
              aria-current={
                item.organization.id === selectedResponsibilityId
                  ? "true"
                  : undefined
              }
              onClick={() => isMobile && setOpenMobile(false)}
            >
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
