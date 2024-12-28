import { TFunction } from "i18next";
import { usePathParams } from "raviger";
import * as React from "react";
import { useEffect, useState } from "react";
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

import { UserFacilityModel, UserModel } from "@/components/Users/models";

import { PatientUserContextType } from "@/Providers/PatientUserProvider";
import { AppointmentPatient } from "@/pages/Patient/Utils";

import { PatientSwitcher } from "./patient-switcher";

const facilityLinks = (selectedFacility: UserFacilityModel | null, t: any) => {
  if (!selectedFacility) {
    return [];
  } else {
    const baseUrl = `/facility/${selectedFacility.id}`;
    return [
      { name: t("facility"), url: `${baseUrl}`, icon: "d-hospital" },
      {
        name: t("appointments"),
        url: `${baseUrl}/appointments`,
        icon: "d-calendar",
      },
      { name: t("patients"), url: `${baseUrl}/patients`, icon: "d-patient" },
      {
        name: t("encounters"),
        url: `${baseUrl}/encounters`,
        icon: "d-patient",
      },
      { name: t("assets"), url: `${baseUrl}/assets`, icon: "d-folder" },
      { name: t("shifting"), url: "/shifting", icon: "d-ambulance" },
      { name: t("resource"), url: "/resource", icon: "d-book-open" },
      { name: t("users"), url: `${baseUrl}/users`, icon: "d-people" },
      { name: t("All users"), url: "/users", icon: "d-people" },
      { name: t("Ext organisation"), url: "/organisation", icon: "d-people" },
      {
        name: t("Facility Organisation"),
        url: `/facility/${selectedFacility.id}/organisation`,
        icon: "d-people",
      },
    ];
  }
};

const patientLinks = (
  selectedUser: AppointmentPatient | null,
  t: TFunction,
) => {
  if (!selectedUser) {
    return [];
  }
  const { state, district, ward, local_body } = selectedUser || {};
  const paramString =
    (state ? `state=${state}&` : "") +
    (district ? `district=${district}&` : "") +
    (ward ? `ward=${ward}&` : "") +
    (local_body ? `local_body=${local_body}` : "");
  const BaseNavItems = [
    { name: t("appointments"), url: "/patient/home", icon: "d-patient" },
    {
      name: t("nearby_facilities"),
      url: `/facilities/?${paramString}`,
      icon: "d-patient",
    },
    {
      name: t("medical_records"),
      url: `/patient/${selectedUser?.id}`,
      icon: "d-book-open",
    },
  ];
  return BaseNavItems;
};

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user?: UserModel;
  facilitySidebar?: boolean;
  patientUserContext?: PatientUserContextType;
};

export function AppSidebar({
  user,
  facilitySidebar = true,
  patientUserContext,
  ...props
}: AppSidebarProps) {
  const exactMatch = usePathParams("/facility/:facilityId");
  const subpathMatch = usePathParams("/facility/:facilityId/*");
  const facilityId = exactMatch?.facilityId || subpathMatch?.facilityId;

  const [selectedFacility, setSelectedFacility] =
    useState<UserFacilityModel | null>(null);

  const { t } = useTranslation();

  useEffect(() => {
    if (user && facilityId && user.facilities && facilitySidebar) {
      const facility = user.facilities.find((f) => f.id === facilityId);
      if (facility) {
        setSelectedFacility(facility);
      }
    }
  }, [facilityId, user, user?.facilities, facilitySidebar]);

  return (
    <Sidebar collapsible="icon" variant="sidebar" {...props}>
      <SidebarHeader>
        {user && user.facilities && user.facilities.length > 0 && (
          <FacilitySwitcher
            facilities={user.facilities}
            selectedFacility={selectedFacility}
          />
        )}
      </SidebarHeader>
      <SidebarContent>
        {facilitySidebar && (
          <NavMain links={facilityLinks(selectedFacility, t)} />
        )}
        {patientUserContext && (
          <>
            <PatientSwitcher patientUserContext={patientUserContext} />
            <NavMain
              links={patientLinks(patientUserContext.selectedPatient, t)}
            />
          </>
        )}
      </SidebarContent>
      <SidebarFooter>
        {facilitySidebar && <FacilityNavUser />}
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
