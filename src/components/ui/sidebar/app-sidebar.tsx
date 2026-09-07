import careConfig from "@careConfig";
import { X } from "lucide-react";
import { Link, useLocationChange, usePath } from "raviger";
import * as React from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { AdminNav } from "@/components/ui/sidebar/admin-nav";
import { useAppSidebar } from "@/components/ui/sidebar/app-sidebar-provider";
import { FacilityNav } from "@/components/ui/sidebar/facility/facility-nav";
import { LocationNav } from "@/components/ui/sidebar/facility/location/location-nav";
import { LocationSwitcher } from "@/components/ui/sidebar/facility/location/location-switcher";
import { ServiceNav } from "@/components/ui/sidebar/facility/service/service-nav";
import { FacilitySettingsNav } from "@/components/ui/sidebar/facility/settings/facility-settings-nav";
import { FacilitySettingsSidebarHeader } from "@/components/ui/sidebar/facility/settings/facility-settings-sidebar-header";
import {
  FacilityNavUser,
  PatientNavUser,
} from "@/components/ui/sidebar/nav-user";
import { OrgNav } from "@/components/ui/sidebar/org-nav";
import { PatientNav } from "@/components/ui/sidebar/patient-nav";
import { ResponsibilityNav } from "@/components/ui/sidebar/responsibility-switcher";

import { useRouteParams } from "@/hooks/useRouteParams";
import { ServiceSwitcher } from "./facility/service/service-switcher";

import PinPageDialog from "@/components/Common/PinPageDialog";
import { isFacilitySettingsPath } from "@/pages/Facility/settings/utils";
import { FacilityBareMinimum } from "@/types/facility/facility";
import { CurrentUserRead } from "@/types/user/user";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: CurrentUserRead;
  facilitySidebar?: boolean;
  sidebarFor?: SidebarFor;
}

export enum SidebarFor {
  FACILITY = "facility",
  PATIENT = "patient",
  ADMIN = "admin",
}

export function AppSidebar({
  user,
  sidebarFor = SidebarFor.FACILITY,
  ...props
}: AppSidebarProps) {
  const { t } = useTranslation();

  const { facilityId } = useRouteParams("/facility/:facilityId");
  const { locationId } = useRouteParams("/facility/:_/locations/:locationId");
  const { organizationId } = useRouteParams("/organization/:organizationId");
  const { responsibilityId } = useRouteParams(
    "/responsibilities/:responsibilityId",
  );
  const { serviceId } = useRouteParams(
    "/facility/:facilityId/services/:serviceId",
  );

  const path = usePath() ?? "";
  const facilitySettingsSidebar =
    !!facilityId &&
    isFacilitySettingsPath(path) &&
    sidebarFor === SidebarFor.FACILITY;

  const facilitySidebar =
    !!facilityId &&
    !locationId &&
    !serviceId &&
    !facilitySettingsSidebar &&
    sidebarFor === SidebarFor.FACILITY;
  const facilityLocationSidebar =
    !!facilityId &&
    !!locationId &&
    !serviceId &&
    sidebarFor === SidebarFor.FACILITY;
  const facilityServiceSidebar =
    !!facilityId &&
    !!serviceId &&
    !locationId &&
    sidebarFor === SidebarFor.FACILITY;

  const patientSidebar = sidebarFor === SidebarFor.PATIENT;
  const adminSidebar = sidebarFor === SidebarFor.ADMIN;

  const { isMobile, setOpenMobile } = useSidebar();
  const {
    pinned,
    innerWorkspace,
    cancelClose,
    scheduleClose,
    handleSidebarFocus,
    handleSidebarBlur,
  } = useAppSidebar();
  const showHeader = pinned || isMobile;
  const [selectedFacility, setSelectedFacility] =
    React.useState<FacilityBareMinimum | null>(null);

  const selectedOrganization = React.useMemo(() => {
    if (!user?.organizations || !organizationId) return undefined;
    return user.organizations.find((org) => org.id === organizationId);
  }, [user?.organizations, organizationId]);

  React.useEffect(() => {
    if (
      !user?.facilities ||
      !facilityId ||
      !(facilitySidebar || facilitySettingsSidebar)
    ) {
      setSelectedFacility(null);
      return;
    }

    const facility = user.facilities.find((f) => f.id === facilityId) || null;
    setSelectedFacility(facility);
  }, [facilityId, user?.facilities, facilitySidebar, facilitySettingsSidebar]);

  useLocationChange(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  });

  return (
    <Sidebar
      collapsible="offcanvas"
      variant={innerWorkspace ? "sidebar" : "inset"}
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      onFocusCapture={handleSidebarFocus}
      onBlurCapture={handleSidebarBlur}
      {...props}
      className={cn(
        "border-neutral-200 [&_[data-sidebar=sidebar]]:bg-neutral-100 [&_[data-sidebar=sidebar]]:text-neutral-950",
        props.className,
      )}
    >
      <SidebarHeader
        inert={!showHeader}
        aria-hidden={!showHeader}
        className={cn(
          "overflow-hidden border-b border-neutral-200 bg-neutral-100 text-neutral-950 transition-[max-height,padding] motion-reduce:transition-none",
          !innerWorkspace && "px-0",
          showHeader
            ? "min-h-14 py-2"
            : "max-h-0 min-h-0 border-transparent py-0",
        )}
      >
        {facilitySettingsSidebar ? (
          <FacilitySettingsSidebarHeader />
        ) : facilityLocationSidebar ? (
          <LocationSwitcher />
        ) : facilityServiceSidebar ? (
          <ServiceSwitcher />
        ) : (
          <div className="flex min-h-9 items-center gap-2 px-2">
            <Link
              href="/"
              basePath="/"
              aria-label={t("view_dashboard")}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-400"
            >
              <img
                src={careConfig.mainLogo?.dark}
                alt={t("care")}
                className="h-9 w-auto max-w-full object-contain"
              />
            </Link>
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto size-8 text-neutral-600 hover:bg-neutral-200 focus-visible:ring-indigo-400"
                aria-label={t("close_sidebar")}
                onClick={() => setOpenMobile(false)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="gap-2 bg-neutral-100 text-neutral-950">
        {facilityLocationSidebar && <LocationNav />}
        {facilitySettingsSidebar && <FacilitySettingsNav />}
        {facilityServiceSidebar && <ServiceNav />}
        {facilitySidebar &&
          !facilityLocationSidebar &&
          !facilityServiceSidebar &&
          !selectedOrganization && (
            <FacilityNav selectedFacility={selectedFacility} />
          )}
        {responsibilityId && <ResponsibilityNav />}
        {selectedOrganization && !responsibilityId && (
          <OrgNav organizations={user?.organizations || []} />
        )}
        {patientSidebar && <PatientNav />}
        {adminSidebar && <AdminNav />}
        {(facilitySidebar ||
          facilityLocationSidebar ||
          facilityServiceSidebar ||
          facilitySettingsSidebar ||
          adminSidebar) && <PinPageDialog />}
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 bg-neutral-100 text-neutral-950">
        {patientSidebar ? (
          <PatientNavUser />
        ) : (
          <FacilityNavUser
            selectedFacilityId={
              facilitySidebar || facilitySettingsSidebar
                ? selectedFacility?.id
                : undefined
            }
          />
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
