import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { NavMain } from "@/components/ui/sidebar/nav-main";
import { PatientSwitcher } from "@/components/ui/sidebar/patient-switcher";

import { usePatientContext } from "@/hooks/usePatientUser";

import { AppointmentPatient } from "@/pages/Patient/Utils";

interface NavigationLink {
  name: string;
  url: string;
  icon?: string;
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

export function PatientNav() {
  const { t } = useTranslation();
  const patientUserContext = usePatientContext();
  const selectedPatient = patientUserContext?.selectedPatient;

  return (
    <>
      <PatientSwitcher />
      <NavMain links={generatePatientLinks(selectedPatient, t)} />
    </>
  );
}
