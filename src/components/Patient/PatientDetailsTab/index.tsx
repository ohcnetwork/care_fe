import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";

import { HasPermissionFn, getPermissions } from "@/common/Permissions";

import { Patient } from "@/types/emr/newPatient";

import { Appointments } from "./Appointments";
import { PatientDrawingTab } from "./PatientDrawingsTab";
import { PatientFilesTab } from "./PatientFiles";
import { PatientUsers } from "./PatientUsers";
import { ResourceRequests } from "./ResourceRequests";
import { Updates } from "./patientUpdates";

export interface PatientProps {
  facilityId?: string;
  patientId: string;
  patientData: Patient;
}

export interface Tab {
  route: string;
  component: (props: PatientProps) => JSX.Element;
  visible?: boolean;
}

interface Tabs {
  getPatientTabs: Tab[];
}

export const BASE_PATIENT_TABS: Tab[] = [
  {
    route: "demography",
    component: Demography,
  },
  {
    route: "appointments",
    component: Appointments,
  },
  {
    route: "encounters",
    component: EncounterHistory,
  },
  {
    route: "health-profile",
    component: HealthProfileSummary,
  },
  {
    route: "updates",
    component: Updates,
  },
  {
    route: "resource_requests",
    component: ResourceRequests,
  },
  {
    route: "users",
    component: PatientUsers,
  },
  {
    route: "files",
    component: PatientFilesTab,
  },
  {
    route: "drawings",
    component: PatientDrawingTab,
  },
];

export function getTabs(
  permissions: string[],
  hasPermission: HasPermissionFn,
): Tabs {
  const {
    canViewAppointments,
    canViewEncounter,
    canViewClinicalData,
    canViewPatientQuestionnaireResponses,
    canListEncounters,
    canViewPatients,
  } = getPermissions(hasPermission, permissions);

  const getTabVisibility = (tab: Tab) => {
    switch (tab.route) {
      case "appointments":
        return { ...tab, visible: canViewAppointments };
      case "encounters":
        return { ...tab, visible: canListEncounters || canViewPatients };
      case "health-profile":
        return { ...tab, visible: canViewClinicalData };
      case "files":
        return { ...tab, visible: canViewEncounter || canViewClinicalData };
      case "updates":
        return {
          ...tab,
          visible: canViewPatientQuestionnaireResponses,
        };
      default:
        return tab;
    }
  };

  return {
    getPatientTabs: BASE_PATIENT_TABS.map((tab) =>
      getTabVisibility(tab),
    ).filter((tab) => tab.visible ?? true),
  };
}

// For router types
export const patientTabs = BASE_PATIENT_TABS;
