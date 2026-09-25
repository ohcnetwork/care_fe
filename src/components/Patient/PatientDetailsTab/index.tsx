import { lazy } from "react";

import { HasPermissionFn, getPermissions } from "@/common/Permissions";

import { PatientRead } from "@/types/emr/patient/patient";

const Demography = lazy(() =>
  import("@/components/Patient/PatientDetailsTab/Demography").then(
    (module) => ({
      default: module.Demography,
    }),
  ),
);
const EncounterHistory = lazy(
  () => import("@/components/Patient/PatientDetailsTab/EncounterHistory"),
);
const ClinicalHistory = lazy(() =>
  import("./ClinicalHistory").then((module) => ({
    default: module.ClinicalHistory,
  })),
);
const BookingsList = lazy(() =>
  import("@/pages/Appointments/BookAppointment/BookingsList").then(
    (module) => ({
      default: module.BookingsList,
    }),
  ),
);
const Accounts = lazy(() =>
  import("./Accounts").then((module) => ({ default: module.Accounts })),
);
const PatientFilesTab = lazy(() =>
  import("./PatientFiles").then((module) => ({
    default: module.PatientFilesTab,
  })),
);
const PatientNotesTab = lazy(() =>
  import("./PatientNotes").then((module) => ({
    default: module.PatientNotesTab,
  })),
);
const PatientUsers = lazy(() =>
  import("./PatientUsers").then((module) => ({ default: module.PatientUsers })),
);
const ResourceRequests = lazy(() =>
  import("./ResourceRequests").then((module) => ({
    default: module.ResourceRequests,
  })),
);
const Updates = lazy(() =>
  import("./patientUpdates").then((module) => ({ default: module.Updates })),
);

export interface PatientProps {
  facilityId?: string;
  patientId: string;
  patientData: PatientRead;
}

export interface Tab {
  route: string;
  component: (props: PatientProps) => React.ReactNode;
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
    component: BookingsList,
  },
  {
    route: "encounters",
    component: EncounterHistory,
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
    route: "notes",
    component: PatientNotesTab,
  },
  {
    route: "files",
    component: PatientFilesTab,
  },
  {
    route: "accounts",
    component: Accounts,
  },
  {
    route: "clinical_history",
    component: ClinicalHistory,
  },
];

export function getTabs(
  permissions: string[],
  hasPermission: HasPermissionFn,
): Tabs {
  const {
    canViewAppointments,
    canReadEncounter,
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
      case "files":
        return { ...tab, visible: canReadEncounter || canViewClinicalData };
      case "clinical_history":
        return { ...tab, visible: canViewClinicalData };
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
