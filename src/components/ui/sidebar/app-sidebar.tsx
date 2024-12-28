import { TFunction } from "i18next";
import { usePathParams } from "raviger";
import * as React from "react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { Avatar } from "@/components/Common/Avatar";
import { UserFacilityModel, UserModel } from "@/components/Users/models";

import { PatientUserContextType } from "@/Routers/PatientRouter";
import { classNames } from "@/Utils/utils";
import { AppointmentPatient } from "@/pages/Patient/Utils";

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
      { name: t("users"), url: "/users", icon: "d-people" },
      { name: t("organisation"), url: "/organisation", icon: "d-people" },
      {
        name: t("facility_organisation"),
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
            <div
              className={classNames("mx-2 mt-4 mb-2 flex flex-wrap flex-row")}
            >
              <Select
                disabled={patientUserContext.patients?.length === 0}
                value={
                  patientUserContext.selectedPatient
                    ? patientUserContext.selectedPatient.id
                    : "Book "
                }
                onValueChange={(value) => {
                  const patient = patientUserContext.patients?.find(
                    (patient) => patient.id === value,
                  );
                  if (patient) {
                    patientUserContext.setSelectedPatient(patient);
                    localStorage.setItem(
                      "selectedPatient",
                      JSON.stringify(patient),
                    );
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue
                    asChild
                    placeholder={
                      patientUserContext.patients?.length === 0
                        ? t("no_patients")
                        : t("select_patient")
                    }
                  >
                    <div className="flex flex-row justify-between items-center gap-2 w-full text-primary-800">
                      <Avatar
                        name={patientUserContext.selectedPatient?.name}
                        className="h-4 w-4"
                      />
                      {
                        <div className="flex flex-row items-center justify-between w-full gap-2">
                          <span className="font-semibold truncate max-w-32">
                            {patientUserContext.selectedPatient?.name}
                          </span>
                          <span className="text-xs text-secondary-600">
                            {t("switch")}
                          </span>
                        </div>
                      }
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {patientUserContext.patients?.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id}>
                      <div className="flex flex-row items-center gap-2">
                        <Avatar name={patient.name} className="h-4 w-4" />
                        {patient.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
