import { DashboardIcon } from "@radix-ui/react-icons";
import { TFunction } from "i18next";
import { Link, usePathParams } from "raviger";
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
} from "@/components/ui/sidebar";
import { FacilitySwitcher } from "@/components/ui/sidebar/facility-switcher";
import { NavMain } from "@/components/ui/sidebar/nav-main";
import {
  FacilityNavUser,
  PatientNavUser,
} from "@/components/ui/sidebar/nav-user";
import { OrganizationSwitcher } from "@/components/ui/sidebar/organization-switcher";

import { UserFacilityModel, UserModel } from "@/components/Users/models";

import { PatientUserContextType } from "@/Providers/PatientUserProvider";
import { AppointmentPatient } from "@/pages/Patient/Utils";
import { Organization } from "@/types/organization/organization";

import { PatientSwitcher } from "./patient-switcher";

interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user?: UserModel;
  facilitySidebar?: boolean;
  patientUserContext?: PatientUserContextType;
}

function generateFacilityLinks(
  selectedFacility: UserFacilityModel | null,
  t: TFunction,
  // TODO: switch to UserBase once getcurrentuser serializer is updated
  user?: UserModel,
) {
  if (!selectedFacility) return [];

  const baseUrl = `/facility/${selectedFacility.id}`;
  const links: NavigationLink[] = [
    { name: t("facility"), url: baseUrl, icon: "d-hospital" },
    {
      name: t("appointments"),
      url: `${baseUrl}/appointments`,
      icon: "d-calendar",
    },
    {
      name: t("search_patients"),
      url: `${baseUrl}/patients`,
      icon: "d-patient",
    },
    { name: t("encounters"), url: `${baseUrl}/encounters`, icon: "d-patient" },
    // { name: t("assets"), url: `${baseUrl}/assets`, icon: "d-folder" },
    { name: t("resource"), url: "/resource", icon: "d-book-open" },
    { name: t("users"), url: `${baseUrl}/users`, icon: "d-people" },
    {
      name: t("organization"),
      url: `${baseUrl}/organization`,
      icon: "d-book-open",
    },
  ];

  if (user) {
    links.push({
      name: t("schedules"),
      url: `${baseUrl}/users/${user.username}/availability`,
      icon: "d-calendar",
    });
  }

  return links;
}

function generateOrganizationLinks(
  organizations: Organization[],
): NavigationLink[] {
  return organizations.map((org) => ({
    name: org.name,
    url: `/organization/${org.id}`,
  }));
}

function generatePatientLinks(
  selectedUser: AppointmentPatient | null,
  t: TFunction,
): NavigationLink[] {
  if (!selectedUser) return [];

  const { geo_organization } = selectedUser;
  let parentOrganization = geo_organization?.parent;
  while (parentOrganization?.parent) {
    if (parentOrganization.level_cache === 1) {
      break;
    }
    parentOrganization = parentOrganization.parent;
  }

  const queryParams = new URLSearchParams();

  if (parentOrganization) {
    queryParams.set("organization", String(parentOrganization?.id));
  }

  return [
    { name: t("appointments"), url: "/patient/home", icon: "d-patient" },
    {
      name: t("nearby_facilities"),
      url: `/nearby_facilities/?${queryParams.toString()}`,
      icon: "d-patient",
    },
  ];
}

export function AppSidebar({
  user,
  facilitySidebar = true,
  patientUserContext,
  ...props
}: AppSidebarProps) {
  const exactMatch = usePathParams("/facility/:facilityId");
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = exactMatch?.facilityId || subpathMatch?.facilityId;

  const orgMatch = usePathParams("/organization/:id");
  const orgSubpathMatch = usePathParams("/organization/:id/*");
  const organizationId = orgMatch?.id || orgSubpathMatch?.id;

  const [selectedFacility, setSelectedFacility] =
    React.useState<UserFacilityModel | null>(null);

  const { t } = useTranslation();

  const selectedOrganization = React.useMemo(() => {
    if (!user?.organizations || !organizationId) return undefined;
    return user.organizations.find((org) => org.id === organizationId);
  }, [user?.organizations, organizationId]);

  React.useEffect(() => {
    if (!user?.facilities || !facilityId || !facilitySidebar) return;

    const facility = user.facilities.find((f) => f.id === facilityId);
    if (facility) {
      setSelectedFacility(facility);
    }
  }, [facilityId, user?.facilities, facilitySidebar]);

  const hasFacilities = user?.facilities && user.facilities.length > 0;
  const hasOrganizations = user?.organizations && user.organizations.length > 0;

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
        {selectedFacility && hasFacilities && (
          <FacilitySwitcher
            facilities={user?.facilities || []}
            selectedFacility={selectedFacility}
          />
        )}
        {!selectedFacility && !selectedOrganization && (
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
                      View Dashboard
                    </span>
                  </div>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarHeader>

      <SidebarContent>
        {facilitySidebar && !selectedOrganization && (
          <NavMain links={generateFacilityLinks(selectedFacility, t, user)} />
        )}
        {selectedOrganization && (
          <NavMain
            links={generateOrganizationLinks(user?.organizations || [])}
          />
        )}
        {patientUserContext && (
          <>
            <PatientSwitcher patientUserContext={patientUserContext} />
            <NavMain
              links={generatePatientLinks(
                patientUserContext.selectedPatient,
                t,
              )}
            />
          </>
        )}
      </SidebarContent>

      <SidebarFooter>
        {(facilitySidebar || selectedOrganization) && <FacilityNavUser />}
        {patientUserContext && (
          <PatientNavUser
            patient={patientUserContext.selectedPatient}
            phoneNumber={patientUserContext.tokenData.phoneNumber}
          />
        )}
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
