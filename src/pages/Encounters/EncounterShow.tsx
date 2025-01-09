import { useQuery } from "@tanstack/react-query";
import { Link } from "raviger";
import { useTranslation } from "react-i18next";

import Loading from "@/components/Common/Loading";
import PageHeadTitle from "@/components/Common/PageHeadTitle";
import PageTitle from "@/components/Common/PageTitle";
import ErrorPage from "@/components/ErrorPages/DefaultErrorPage";
import { EncounterProvider } from "@/components/Facility/ConsultationDetails/EncounterContext";
import PatientInfoCard from "@/components/Patient/PatientInfoCard";

import { useCareAppConsultationTabs } from "@/hooks/useCareApps";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, keysOf } from "@/Utils/utils";
import { EncounterFilesTab } from "@/pages/Encounters/tabs/EncounterFilesTab";
import { EncounterMedicinesTab } from "@/pages/Encounters/tabs/EncounterMedicinesTab";
import { EncounterPlotsTab } from "@/pages/Encounters/tabs/EncounterPlotsTab";
import { EncounterUpdatesTab } from "@/pages/Encounters/tabs/EncounterUpdatesTab";
import { Encounter } from "@/types/emr/encounter";
import { Patient } from "@/types/emr/newPatient";

import { EncounterNotesTab } from "./tabs/EncounterNotesTab";

export interface EncounterTabProps {
  facilityId: string;
  encounter: Encounter;
  patient: Patient;
}

const defaultTabs = {
  // feed: EncounterFeedTab,
  updates: EncounterUpdatesTab,
  plots: EncounterPlotsTab,
  medicines: EncounterMedicinesTab,
  files: EncounterFilesTab,
  notes: EncounterNotesTab,
  // nursing: EncounterNursingTab,
  // neurological_monitoring: EncounterNeurologicalMonitoringTab,
  // pressure_sore: EncounterPressureSoreTab,
} as Record<string, React.FC<EncounterTabProps>>;

interface Props {
  encounterId: string;
  facilityId: string;
  tab?: string;
}

export const EncounterShow = (props: Props) => {
  const { facilityId, encounterId } = props;
  const { t } = useTranslation();
  const pluginTabs = useCareAppConsultationTabs();

  const tabs: Record<string, React.FC<EncounterTabProps>> = {
    ...defaultTabs,
    ...pluginTabs,
  };

  // if (Object.keys(tabs).includes(tab.toUpperCase())) {
  //   tab = tab.toUpperCase();
  // }
  // const [showDoctors, setShowDoctors] = useState(false);
  // const [patientData, setPatientData] = useState<PatientModel>();
  // const [activeShiftingData, setActiveShiftingData] = useState<Array<any>>([]);

  // const getPatientGender = (patientData: any) =>
  //   GENDER_TYPES.find((i) => i.id === patientData.gender)?.text;

  // const getPatientAddress = (patientData: any) =>
  //   `${patientData.address},\n${patientData.ward_object?.name},\n${patientData.local_body_object?.name},\n${patientData.district_object?.name},\n${patientData.state_object?.name}`;

  // const getPatientComorbidities = (patientData: any) => {
  //   if (patientData?.medical_history?.length) {
  //     return humanizeStrings(
  //       patientData.medical_history.map((item: any) => item.disease),
  //     );
  //   } else {
  //     return "None";
  //   }
  // };

  // const authUser = useAuthUser();

  const { data: encounterData, isLoading } = useQuery({
    queryKey: ["encounter", encounterId],
    queryFn: query(routes.encounter.get, {
      pathParams: { id: encounterId },
      queryParams: {
        facility: facilityId,
      },
    }),
    enabled: !!encounterId,
  });

  // const encounterQuery = useTanStackQueryInstead(routes.encounter.get, {
  //   pathParams: { id: consultationId },
  // });

  // const consultationData = encounterQuery.data;
  // const bedId = consultationData?.current_bed?.bed_object?.id;

  // const isCameraAttached = useTanStackQueryInstead(routes.listAssetBeds, {
  //   prefetch: !!bedId,
  //   query: { bed: bedId },
  // }).data?.results.some((a) => a.asset_object.asset_class === "ONVIF");

  // const patientDataQuery = useTanStackQueryInstead(routes.getPatient, {
  //   pathParams: { id: consultationQuery.data?.patient ?? "" },
  //   prefetch: !!consultationQuery.data?.patient,
  //   onResponse: ({ data }) => {
  //     if (!data) {
  //       return;
  //     }
  //     setPatientData({
  //       ...data,
  //       gender: getPatientGender(data),
  //       address: getPatientAddress(data),
  //       comorbidities: getPatientComorbidities(data),
  //       is_declared_positive: data.is_declared_positive ? "Yes" : "No",
  //       is_vaccinated: patientData?.is_vaccinated ? "Yes" : "No",
  //     } as any);
  //   },
  // });

  // const fetchData = useCallback(
  //   async (id: string) => {
  //     // Get shifting data
  //     const shiftRequestsQuery = await request(routes.listShiftRequests, {
  //       query: { patient: id },
  //     });
  //     if (shiftRequestsQuery.data?.results) {
  //       setActiveShiftingData(shiftRequestsQuery.data.results);
  //     }
  //   },
  //   [consultationId, patientData?.is_vaccinated],
  // );

  // useEffect(() => {
  //   const id = patientDataQuery.data?.id;
  //   if (!id) {
  //     return;
  //   }
  //   fetchData(id);
  //   triggerGoal("Patient Consultation Viewed", {
  //     facilityId: facilityId,
  //     consultationId: consultationId,
  //     userId: authUser.id,
  //   });
  // }, [patientDataQuery.data?.id]);

  if (isLoading || !encounterData) {
    return <Loading />;
  }

  const encounterTabProps: EncounterTabProps = {
    encounter: encounterData,
    patient: encounterData.patient,
    facilityId,
  };

  if (!props.tab) {
    return <ErrorPage />;
  }

  if (!encounterData) {
    return <ErrorPage />;
  }

  const SelectedTab = tabs[props.tab];

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer font-bold whitespace-nowrap ${
      selected === true
        ? "border-primary-500 hover:border-secondary-300 text-primary-600 border-b-2"
        : "text-secondary-700 hover:text-secondary-700"
    }`;

  return (
    <EncounterProvider
      initialContext={{
        encounter: encounterData,
        patient: encounterData.patient,
      }}
    >
      <nav className="relative flex flex-wrap items-start justify-between">
        <PageTitle
          title={t("encounter")}
          crumbsReplacements={{
            [encounterId]: { name: encounterData.patient.name },
            consultation: {
              name: "Consultation",
              uri: `/facility/${facilityId}/patient/${encounterData.patient.id}/consultation/${encounterId}/update`,
            },
            [encounterId]: {
              name: encounterData.status,
            },
          }}
          breadcrumbs={true}
          backUrl="/patients"
        />
        <div
          className="flex w-full flex-col min-[1150px]:w-min min-[1150px]:flex-row min-[1150px]:items-center"
          id="consultationpage-header"
        >
          {/* {!consultationData.discharge_date && (
            <>
              <button
                id="doctor-connect-button"
                onClick={() => {
                  triggerGoal("Doctor Connect Clicked", {
                    consultationId,
                    facilityId: patientData.facility,
                    userId: authUser.id,
                    page: "ConsultationDetails",
                  });
                  setShowDoctors(true);
                }}
                className="btn btn-primary m-1 w-full hover:text-white"
              >
                Doctor Connect
              </button>
              {patientData.last_consultation?.id &&
                isCameraAttached &&
                CameraFeedPermittedUserTypes.includes(authUser.user_type) && (
                  <Link
                    href={`/facility/${patientData.facility}/patient/${patientData.id}/consultation/${patientData.last_consultation?.id}/feed`}
                    className="btn btn-primary m-1 w-full hover:text-white"
                  >
                    Camera Feed
                  </Link>
                )}
            </>
          )} */}
          <Link
            href={`/facility/${facilityId}/patient/${encounterData.patient.id}`}
            className="btn btn-primary m-1 w-full hover:text-white"
            id="patient-details"
          >
            {t("patient_details")}
          </Link>
        </div>
      </nav>
      <div className="mt-4 w-full border-b-2 border-secondary-200">
        <div className="mt-2 flex w-full flex-col md:flex-row">
          <div className="size-full rounded-lg border bg-white text-black shadow">
            <PatientInfoCard
              patient={encounterData.patient}
              encounter={encounterData}
              fetchPatientData={() => {}}
            />

            <div className="flex flex-col justify-between gap-2 px-4 py-1 md:flex-row">
              <div className="font-base flex flex-col text-xs leading-relaxed text-secondary-700 md:text-right">
                <div className="flex items-center">
                  <span className="text-secondary-900">
                    {t("last_modified")}:{" "}
                  </span>
                  &nbsp;
                  {formatDateTime(encounterData.modified_date)}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 w-full border-b-2 border-secondary-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav
                className="flex space-x-6 overflow-x-auto pb-2 pl-2"
                id="encounter_tab_nav"
              >
                {keysOf(tabs).map((tab) => (
                  <Link
                    key={tab}
                    className={tabButtonClasses(props.tab === tab)}
                    href={`/facility/${facilityId}/encounter/${encounterData.id}/${tab}`}
                  >
                    {t(`ENCOUNTER_TAB__${tab}`)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <PageHeadTitle title={t(`ENCOUNTER_TAB__${props.tab}`)} />
          <SelectedTab {...encounterTabProps} />
        </div>
      </div>
    </EncounterProvider>
  );
};
