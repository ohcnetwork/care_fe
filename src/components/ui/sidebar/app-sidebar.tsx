import { DashboardIcon } from "@radix-ui/react-icons";
import { Link, useLocationChange } from "raviger";
import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { AdminNav } from "@/components/ui/sidebar/admin-nav";
import { FacilityNav } from "@/components/ui/sidebar/facility/facility-nav";
import { FacilitySwitcher } from "@/components/ui/sidebar/facility/facility-switcher";
import { LocationNav } from "@/components/ui/sidebar/facility/location/location-nav";
import { LocationSwitcher } from "@/components/ui/sidebar/facility/location/location-switcher";
import {
  FacilityNavUser,
  PatientNavUser,
} from "@/components/ui/sidebar/nav-user";
import { OrgNav } from "@/components/ui/sidebar/org-nav";
import { OrganizationSwitcher } from "@/components/ui/sidebar/organization-switcher";
import { PatientNav } from "@/components/ui/sidebar/patient-nav";

import { useRouteParams } from "@/hooks/useRouteParams";

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

  const facilitySidebar =
    !!facilityId && !locationId && sidebarFor === SidebarFor.FACILITY;
  const facilityLocationSidebar =
    !!facilityId && !!locationId && sidebarFor === SidebarFor.FACILITY;

  const patientSidebar = sidebarFor === SidebarFor.PATIENT;
  const adminSidebar = sidebarFor === SidebarFor.ADMIN;

  const { isMobile, setOpenMobile } = useSidebar();
  const [selectedFacility, setSelectedFacility] =
    React.useState<FacilityBareMinimum | null>(null);

  const selectedOrganization = React.useMemo(() => {
    if (!user?.organizations || !organizationId) return undefined;
    return user.organizations.find((org) => org.id === organizationId);
  }, [user?.organizations, organizationId]);

  React.useEffect(() => {
    if (!user?.facilities || !facilityId || !facilitySidebar) {
      setSelectedFacility(null);
      return;
    }

    const facility = user.facilities.find((f) => f.id === facilityId) || null;
    setSelectedFacility(facility);
  }, [facilityId, user?.facilities, facilitySidebar]);

  const hasFacilities = user?.facilities && user.facilities.length > 0;
  const hasOrganizations = user?.organizations && user.organizations.length > 0;

  useLocationChange(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  });

  return (
    <Sidebar
      collapsible="icon"
      variant="sidebar"
      {...props}
      className="group-data-[side=left]:border-r-0"
    >
      <SidebarHeader>
        {selectedOrganization && hasOrganizations && (
          <OrganizationSwitcher
            organizations={user?.organizations || []}
            selectedOrganization={selectedOrganization}
          />
        )}
        {facilityId && selectedFacility && hasFacilities && (
          <FacilitySwitcher
            facilities={user?.facilities || []}
            selectedFacility={selectedFacility}
          />
        )}
        {locationId && <LocationSwitcher />}
        {!locationId && !selectedFacility && !selectedOrganization && (
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground hover:bg-white mt-2"
              >
                <Link href="/">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-sidebar-primary-foreground">
                    <DashboardIcon className="size-4" />
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight text-gray-900">
                    <span className="truncate font-semibold">
                      {t("view_dashboard")}
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {facilityLocationSidebar && <LocationNav />}
        {facilitySidebar &&
          !facilityLocationSidebar &&
          !selectedOrganization && (
            <FacilityNav selectedFacility={selectedFacility} />
          )}
        {selectedOrganization && (
          <OrgNav organizations={user?.organizations || []} />
        )}
        {patientSidebar && <PatientNav />}
        {adminSidebar && <AdminNav />}
      </SidebarContent>

      <SidebarFooter>
        {patientSidebar ? (
          <PatientNavUser />
        ) : (
          <FacilityNavUser
            selectedFacilityId={
              facilitySidebar ? selectedFacility?.id : undefined
            }
          />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
