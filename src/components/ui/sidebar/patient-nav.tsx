import { TFunction } from "i18next";
import { CalendarDays, FolderClosed, Home, Hospital, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { NavMain, NavigationLink } from "@/components/ui/sidebar/nav-main";

import { usePatientContext } from "@/hooks/usePatientUser";

import { PublicPatientRead } from "@/types/emr/patient/patient";

function generatePatientLinks(
  selectedUser: PublicPatientRead | null,
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
      name: t("home"),
      url: "/patient/home",
      icon: <Home />,
    },
    {
      name: t("visits"),
      url: "/patient/visits",
      icon: <CalendarDays />,
    },
    {
      name: t("records"),
      url: "/patient/records",
      icon: <FolderClosed />,
    },
    {
      name: t("profile"),
      url: "/patient/profile",
      icon: <User />,
    },
    {
      name: t("nearby_facilities"),
      url: `/nearby_facilities/?${queryParams.toString()}`,
      icon: <Hospital />,
    },
  ];
}

export function PatientNav() {
  const { t } = useTranslation();
  const patientUserContext = usePatientContext();
  const selectedPatient = patientUserContext?.selectedPatient;

  return (
    <NavMain
      label={t("patient_care")}
      links={generatePatientLinks(selectedPatient, t)}
    />
  );
}
