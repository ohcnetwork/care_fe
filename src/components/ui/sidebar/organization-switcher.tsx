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

import { Organization } from "@/types/organization/organization";

interface Props {
  organizations: Organization[];
  selectedOrganization: Organization | undefined;
}

export function OrganizationSwitcher({
  organizations,
  selectedOrganization,
}: Props) {
  const { isMobile, setOpenMobile } = useSidebar();
  const { handleMenuOpenChange } = useAppSidebar();
  const { t } = useTranslation();

  return (
    <DropdownMenu onOpenChange={handleMenuOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 max-w-full gap-2 rounded-lg border-neutral-300 bg-white px-3 text-sm font-normal text-neutral-950 shadow-sm hover:bg-neutral-100 focus-visible:ring-indigo-400"
          aria-label={
            selectedOrganization
              ? t("my_organizations")
              : t("select_organization")
          }
        >
          {
            <>
              <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                <span className="truncate font-normal">
                  {selectedOrganization
                    ? t("my_organizations")
                    : t("select_organization")}
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
        <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations
          .filter((org) => org.org_type === "govt")
          .map((org) => (
            <DropdownMenuItem
              key={org.id}
              asChild
              className={cn(
                "gap-2 p-2",
                org?.id === selectedOrganization?.id &&
                  "bg-neutral-100 font-medium text-neutral-950 focus:bg-neutral-200 focus:text-neutral-950",
              )}
            >
              <Link
                href={`/organization/${org.id}`}
                aria-current={
                  org.id === selectedOrganization?.id ? "true" : undefined
                }
                onClick={() => isMobile && setOpenMobile(false)}
              >
                {org.name}
              </Link>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
