import { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";
import { PatientSwitcher } from "@/components/ui/sidebar/patient-switcher";

import { usePatientContext } from "@/hooks/usePatientUser";

import { Patient } from "@/types/emr/patient/patient";

function generatePatientLinks(
  selectedUser: Patient | null,
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
    {
      name: t("appointments"),
      url: "/patient/home",
      icon: <CareIcon icon="d-calendar" />,
    },
    {
      name: t("nearby_facilities"),
      url: `/nearby_facilities/?${queryParams.toString()}`,
      icon: <CareIcon icon="d-hospital" />,
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
