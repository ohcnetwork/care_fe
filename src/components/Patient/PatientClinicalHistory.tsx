import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link } from "raviger";
import React from "react";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import { Avatar } from "@/components/Common/Avatar";
import PageHeadTitle from "@/components/Common/PageHeadTitle";

import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatPatientAge, keysOf } from "@/Utils/utils";

import Overview from "./clinicalHistory/Overview";
import DiagnosisTimeline from "./clinicalHistory/PastDiagnosis";
import MedicationTimeline from "./clinicalHistory/PastMedication";
import SymptomsTimeline from "./clinicalHistory/PastSymptoms";

interface TabProps {
  patientId: string;
  facilityId: string;
}

export const clinicalDefaultTabs = {
  overview: Overview,
  symptoms: SymptomsTimeline,
  diagnosis: DiagnosisTimeline,
  medication: MedicationTimeline,
} as Record<string, React.FC<TabProps>>;
export const PatientClinicalHistory = (props: {
  patientId: string;
  tab: string;
  facilityId: string;
}) => {
  const { t } = useTranslation();
  const { data: patientData } = useQuery({
    queryKey: ["patient", props.patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: {
        id: props.patientId,
      },
    }),
    enabled: !!props.patientId,
  });

  if (!patientData) {
    return <div>{t("patient_not_found")}</div>;
  }

  const tabProp: TabProps = {
    patientId: props.patientId,
    facilityId: props.facilityId,
  };
  const SelectedTab = clinicalDefaultTabs[props.tab];

  const tabButtonClasses = (selected: boolean) =>
    `capitalize min-w-max-content cursor-pointer font-bold whitespace-nowrap ${
      selected === true
        ? "border-primary-500 hover:border-secondary-300 text-primary-600 border-b-2"
        : "text-secondary-700 hover:text-secondary-700"
    }`;
  return (
    <>
      <div className="rounded-md bg-white p-3 shadow-xs">
        <div>
          <div className="flex flex-col justify-between gap-4 gap-y-2 md:flex-row">
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="flex flex-row gap-x-4">
                <div className="size-10 shrink-0 md:size-14">
                  <Avatar
                    className="size-10 font-semibold text-secondary-800 md:size-auto"
                    name={patientData.name}
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-col md:flex-row gap-x-4">
                    <h1
                      id="patient-name"
                      className="text-base md:text-xl font-semibold capitalize text-gray-950 mb-2 leading-tight"
                    >
                      {patientData.name}
                    </h1>
                    {patientData.deceased_datetime && (
                      <Badge
                        variant="destructive"
                        className="border-2 border-red-700 bg-red-100 text-red-800 hover:bg-red-200 hover:text-red-900"
                      >
                        <h3 className="text-xs font-normal sm:text-sm sm:font-medium">
                          {t("time_of_death")}
                          {": "}
                          {dayjs(patientData.deceased_datetime).format(
                            "DD MMM YYYY, hh:mm A",
                          )}
                        </h3>
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-sm font-medium text-gray-600 capitalize">
                    {formatPatientAge(patientData, true)},{"  "}
                    {t(`GENDER__${patientData.gender}`)}, {"  "}
                    {patientData.blood_group?.replace("_", " ")}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div>
        <div className="mt-4 w-full border-b-2 border-secondary-200">
          <div className="overflow-x-auto sm:flex sm:items-baseline">
            <div className="mt-4 sm:mt-0">
              <nav
                className="flex space-x-6 overflow-x-auto pb-2 pl-2 pr-6"
                id="encounter_tab_nav"
              >
                {keysOf(clinicalDefaultTabs).map((tab) => (
                  <Link
                    key={tab}
                    data-cy={`tab-${tab}`}
                    className={tabButtonClasses(props.tab === tab)}
                    href={`${tab}`}
                  >
                    {t(`${tab}`)}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <PageHeadTitle title={t(`ENCOUNTER_TAB__${props.tab}`)} />
          <SelectedTab {...tabProp} />
        </div>
      </div>
    </>
  );
};
