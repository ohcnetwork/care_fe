import QuestionnaireResponsesList from "@/components/Facility/ConsultationDetails/QuestionnaireResponsesList";
import EncounterHistory from "@/components/Patient/PatientDetailsTab//EncounterHistory";
import { HealthProfileSummary } from "@/components/Patient/PatientDetailsTab//HealthProfileSummary";
import { Demography } from "@/components/Patient/PatientDetailsTab/Demography";
import { Updates } from "@/components/Patient/PatientDetailsTab/patientUpdates";

import { HasPermissionFn, getPermissions } from "@/common/Permissions";

import { Patient } from "@/types/emr/newPatient";

import { Appointments } from "./Appointments";
import { PatientFilesTab } from "./PatientFiles";
import { PatientUsers } from "./PatientUsers";
import { ResourceRequests } from "./ResourceRequests";

export interface PatientProps {
  facilityId: string;
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
  getFacilityTabs: Tab[];
}

export const BASE_PATIENT_TABS: Tab[] = [
  {
    route: "demography",
    component: Demography,
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
];

export const BASE_FACILITY_TABS: Tab[] = [
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
    component: QuestionnaireResponsesList,
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
          visible:
            canViewClinicalData ||
            canViewEncounter ||
            canViewPatientQuestionnaireResponses,
        };
      default:
        return tab;
    }
  };

  return {
    getPatientTabs: BASE_PATIENT_TABS.map((tab) =>
      getTabVisibility(tab),
    ).filter((tab) => tab.visible ?? true),

    getFacilityTabs: BASE_FACILITY_TABS.map((tab) =>
      getTabVisibility(tab),
    ).filter((tab) => tab.visible ?? true),
  };
}

// For router types
export const patientTabs = BASE_PATIENT_TABS;
export const facilityPatientTabs = BASE_FACILITY_TABS;
