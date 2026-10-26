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
          className="max-w-full gap-2 font-normal shadow-sm"
          aria-label={
            selectedOrganization
              ? t("my_organizations")
              : t("select_organization")
          }
        >
          <span className="truncate">
            {selectedOrganization
              ? t("my_organizations")
              : t("select_organization")}
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
        <DropdownMenuLabel>{t("organizations")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations
          .filter((org) => org.org_type === "govt")
          .map((org) => (
            <DropdownMenuItem key={org.id} asChild className="gap-2">
              <Link
                href={`/organization/${org.id}`}
                aria-current={
                  org.id === selectedOrganization?.id ? "true" : undefined
                }
                onClick={() => isMobile && setOpenMobile(false)}
              >
                {org.id === selectedOrganization?.id ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <span className="size-4 shrink-0" aria-hidden="true" />
                )}
                {org.name}
              </Link>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
