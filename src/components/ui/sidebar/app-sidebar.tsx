import { TFunction } from "i18next";
import { usePathParams } from "raviger";
import * as React from "react";
import { useTranslation } from "react-i18next";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
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
    // { name: t("shifting"), url: "/shifting", icon: "d-ambulance" },
    { name: t("resource"), url: "/resource", icon: "d-book-open" },
    { name: t("users"), url: `${baseUrl}/users`, icon: "d-people" },
    // { name: t("All users"), url: "/users", icon: "d-people" },
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

  const { state, district, ward, local_body } = selectedUser;
  const queryParams = new URLSearchParams();

  if (state) queryParams.set("state", String(state));
  if (district) queryParams.set("district", String(district));
  if (ward) queryParams.set("ward", String(ward));
  if (local_body) queryParams.set("local_body", String(local_body));

  return [
    { name: t("appointments"), url: "/patient/home", icon: "d-patient" },
    {
      name: t("nearby_facilities"),
      url: `/facilities/?${queryParams.toString()}`,
      icon: "d-patient",
    },
    {
      name: t("medical_records"),
      url: `/patient/${selectedUser.id}`,
      icon: "d-book-open",
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
        {selectedOrganization && hasOrganizations && user?.organizations ? (
          <OrganizationSwitcher
            organizations={user.organizations}
            selectedOrganization={selectedOrganization}
          />
        ) : (
          hasFacilities &&
          user?.facilities && (
            <FacilitySwitcher
              facilities={user.facilities}
              selectedFacility={selectedFacility}
            />
          )
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
