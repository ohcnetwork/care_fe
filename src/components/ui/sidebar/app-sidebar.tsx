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
  SidebarRail,
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

const hasCustomLogo = [
  careConfig.mainLogo?.dark,
  careConfig.mainLogo?.light,
].some((source) => source && source !== "/images/care_logo.svg");
const logoOnLight = hasCustomLogo
  ? (careConfig.mainLogo?.dark ?? careConfig.mainLogo?.light)
  : "/images/care_logo_on_light.svg";
const logoOnDark = hasCustomLogo
  ? (careConfig.mainLogo?.light ?? careConfig.mainLogo?.dark)
  : "/images/care_logo_on_dark.svg";

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
    isOverlay,
    innerWorkspace,
    cancelClose,
    scheduleClose,
    handleSidebarFocus,
    handleSidebarBlur,
    setPinned,
  } = useAppSidebar();
  const showHeader = pinned || isMobile || (innerWorkspace && isOverlay);
  const [selectedFacility, setSelectedFacility] =
    React.useState<FacilityBareMinimum | null>(null);

  const userOrganizations = user?.organizations;
  const selectedOrganization = React.useMemo(() => {
    if (!userOrganizations || !organizationId) return undefined;
    return userOrganizations.find((org) => org.id === organizationId);
  }, [userOrganizations, organizationId]);

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
        "z-30 [&>[data-slot=sidebar-inner]]:overflow-visible",
        props.className,
      )}
    >
      <SidebarHeader
        inert={!showHeader}
        aria-hidden={!showHeader}
        className={cn(
          "overflow-hidden border-b",
          showHeader
            ? "border-border min-h-14 py-2"
            : "max-h-0 border-transparent py-0",
        )}
      >
        {facilitySettingsSidebar ? (
          <FacilitySettingsSidebarHeader />
        ) : facilityLocationSidebar ? (
          <LocationSwitcher />
        ) : facilityServiceSidebar ? (
          <ServiceSwitcher />
        ) : (
          <div
            className={cn(
              "flex items-center gap-2 px-2 transition-[opacity,transform] duration-150 ease-linear",
              showHeader
                ? "translate-y-0 opacity-100"
                : "-translate-y-2 opacity-0",
            )}
          >
            <Link
              href="/"
              basePath="/"
              aria-label={t("view_dashboard")}
              className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <img
                src={logoOnLight}
                alt={t("care")}
                className="h-9 w-auto max-w-full object-contain dark:hidden"
              />
              <img
                src={logoOnDark}
                alt={t("care")}
                className="hidden h-9 w-auto max-w-full object-contain dark:block"
              />
            </Link>
            {isMobile && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-auto"
                aria-label={t("close_sidebar")}
                onClick={() => setOpenMobile(false)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        )}
      </SidebarHeader>

      <SidebarContent>
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

      <SidebarFooter className="border-t">
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
      {!isMobile && (
        <SidebarRail
          onClick={() => setPinned(!(pinned || isOverlay))}
          className="group-data-[collapsible=offcanvas]:fixed group-data-[collapsible=offcanvas]:left-0! group-data-[collapsible=offcanvas]:right-auto! group-data-[collapsible=offcanvas]:visible group-data-[collapsible=offcanvas]:translate-x-0!"
        />
      )}
    </Sidebar>
  );
}
