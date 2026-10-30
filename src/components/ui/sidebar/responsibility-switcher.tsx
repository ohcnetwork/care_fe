import { Check, ChevronsUpDown, LayoutDashboard } from "lucide-react";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
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
          className="max-w-full gap-2 font-normal shadow-sm"
          aria-label={selectedItem?.organization.name || t("responsibilities")}
        >
          {
            <>
              <div className="grid min-w-0 flex-1 gap-0.5 text-left text-sm leading-tight">
                <span className="truncate font-normal">
                  {selectedItem?.organization.name || t("responsibilities")}
                </span>
                {selectedItem?.role && (
                  <span className="truncate text-xs text-muted-foreground">
                    {selectedItem.role.name}
                  </span>
                )}
              </div>
              <ChevronsUpDown className="ml-auto size-3.5 shrink-0 opacity-60" />
            </>
          }
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
        <DropdownMenuLabel>{t("responsibilities")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem
            key={item.organization.id}
            asChild
            className="gap-2"
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
              {item.organization.id === selectedResponsibilityId ? (
                <Check className="size-4 text-primary" />
              ) : (
                <span className="size-4 shrink-0" aria-hidden="true" />
              )}
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
