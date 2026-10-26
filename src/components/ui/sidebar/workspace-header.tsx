import { Search } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { WorkspaceHeaderSlot } from "@/components/Common/WorkspaceHeaderSlot";

import { Button } from "@/components/ui/button";
import { InputGroup } from "@/components/ui/input-group";
import { Separator } from "@/components/ui/separator";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { FacilitySwitcher } from "@/components/ui/sidebar/facility/facility-switcher";
import { OrganizationSwitcher } from "@/components/ui/sidebar/organization-switcher";
import { PatientSwitcher } from "@/components/ui/sidebar/patient-switcher";
import { ResponsibilitySwitcher } from "@/components/ui/sidebar/responsibility-switcher";
import { AppSidebarToggle } from "@/components/ui/sidebar/sidebar-toggle";

import { useRouteParams } from "@/hooks/useRouteParams";

import { useWorkspaceHeader } from "@/context/WorkspaceHeaderContext";

import { CurrentUserRead } from "@/types/user/user";

import { ShortcutBadge } from "@/Utils/keyboardShortcutComponents";

interface WorkspaceHeaderProps {
  user?: CurrentUserRead;
  patient?: boolean;
  onSearch?: () => void;
  children?: ReactNode;
}

export function WorkspaceHeader({
  user,
  patient,
  onSearch,
  children,
}: WorkspaceHeaderProps) {
  const { t } = useTranslation();
  const { innerWorkspace } = useAppSidebar();
  const { hasContent } = useWorkspaceHeader();
  const hasCustomContent = hasContent || children != null;
  const { facilityId } = useRouteParams("/facility/:facilityId");
  const { organizationId } = useRouteParams("/organization/:organizationId");
  const { responsibilityId } = useRouteParams(
    "/responsibilities/:responsibilityId",
  );
  const facility = user?.facilities.find((item) => item.id === facilityId);
  const organization = user?.organizations.find(
    (item) => item.id === organizationId,
  );

  return (
    <header
      data-cui-app-header
      className={cn(
        "sticky top-0 z-10 flex shrink-0 items-center gap-3 rounded-t-[inherit] border-b bg-background px-4",
        innerWorkspace ? "min-h-12" : "min-h-14",
      )}
    >
      <AppSidebarToggle />
      <WorkspaceHeaderSlot>
        {children ?? (
          <>
            <Separator orientation="vertical" />
            <div className="min-w-0 max-w-[min(20rem,65vw)]">
              {patient ? (
                <PatientSwitcher />
              ) : responsibilityId ? (
                <ResponsibilitySwitcher
                  selectedResponsibilityId={responsibilityId}
                />
              ) : organization ? (
                <OrganizationSwitcher
                  organizations={user?.organizations ?? []}
                  selectedOrganization={organization}
                />
              ) : facility ? (
                <FacilitySwitcher
                  facilities={user?.facilities ?? []}
                  selectedFacility={facility}
                />
              ) : (
                <span className="truncate text-sm font-medium">
                  {t("care")}
                </span>
              )}
            </div>
          </>
        )}
      </WorkspaceHeaderSlot>
      {onSearch && (
        <div className="ml-auto flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearch}
            aria-label={t("search_page_actions")}
            aria-haspopup="dialog"
            className={hasCustomContent ? "2xl:hidden" : "md:hidden"}
          >
            <Search className="size-4" aria-hidden="true" />
          </Button>
          <InputGroup
            className={cn(
              "hidden h-9 w-52 text-sm",
              hasCustomContent ? "2xl:flex" : "md:flex",
            )}
          >
            <Button
              variant="ghost"
              size="sm"
              data-slot="input-group-control"
              onClick={onSearch}
              aria-label={t("search_page_actions")}
              aria-haspopup="dialog"
              className="h-full min-w-0 w-full justify-start gap-2 rounded-[inherit] border-0 px-2 text-muted-foreground font-normal shadow-none"
            >
              <Search className="size-4" aria-hidden="true" />
              <span className="min-w-0 flex-1 truncate text-left">
                {t("search")}
              </span>
              <ShortcutBadge actionId="show-shortcuts" />
            </Button>
          </InputGroup>
        </div>
      )}
    </header>
  );
}
