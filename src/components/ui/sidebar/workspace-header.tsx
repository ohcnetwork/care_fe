import { Search } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { WorkspaceHeaderSlot } from "@/components/Common/WorkspaceHeaderSlot";

import { Button } from "@/components/ui/button";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { FacilitySwitcher } from "@/components/ui/sidebar/facility/facility-switcher";
import { OrganizationSwitcher } from "@/components/ui/sidebar/organization-switcher";
import { PatientSwitcher } from "@/components/ui/sidebar/patient-switcher";
import { ResponsibilitySwitcher } from "@/components/ui/sidebar/responsibility-switcher";
import { AppSidebarToggle } from "@/components/ui/sidebar/sidebar-toggle";

import { useRouteParams } from "@/hooks/useRouteParams";

import { useWorkspaceHeader } from "@/context/WorkspaceHeaderContext";

import { CurrentUserRead } from "@/types/user/user";

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
        "sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b border-neutral-200 bg-white px-4 text-neutral-950",
        hasContent && "flex-wrap gap-y-1 sm:flex-nowrap",
        innerWorkspace
          ? "min-h-12 py-1.5"
          : "min-h-14 py-2 md:rounded-t-[14px]",
      )}
    >
      <AppSidebarToggle />
      <WorkspaceHeaderSlot>
        {children ?? (
          <>
            <span
              aria-hidden="true"
              className="h-5 w-px shrink-0 bg-neutral-200"
            />
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
        <Button
          variant="outline"
          size="sm"
          onClick={onSearch}
          aria-label={t("search_page_actions")}
          className={cn(
            "ml-auto size-8 shrink-0 gap-2 rounded-lg border-neutral-300 bg-white p-0 text-neutral-500 shadow-sm hover:bg-neutral-100 focus-visible:ring-indigo-400",
            hasCustomContent
              ? "2xl:h-9 2xl:w-52 2xl:justify-start 2xl:px-3"
              : "sm:h-9 sm:w-52 sm:justify-start sm:px-3",
          )}
        >
          <Search className="size-4" aria-hidden="true" />
          <span
            className={
              hasCustomContent ? "hidden 2xl:inline" : "hidden sm:inline"
            }
          >
            {t("search_page_actions")}
          </span>
        </Button>
      )}
    </header>
  );
}
