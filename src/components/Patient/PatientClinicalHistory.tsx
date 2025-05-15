/* eslint-disable @typescript-eslint/no-unused-vars */
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Link, navigate } from "raviger";
import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TooltipComponent } from "@/components/ui/tooltip";

import { Avatar } from "@/components/Common/Avatar";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import {
  getTabs,
  patientTabs as tabs,
} from "@/components/Patient/PatientDetailsTab";

import { getPermissions } from "@/common/Permissions";

import { PLUGIN_Component } from "@/PluginEngine";
import routes from "@/Utils/request/api";
import query from "@/Utils/request/query";
import { formatDateTime, formatPatientAge, relativeTime } from "@/Utils/utils";
import { usePermissions } from "@/context/PermissionContext";
import { Patient } from "@/types/emr/patient";

import SymptomsTimeline from "./clinicalHistory/PastSymptoms";

export const PatientClinicalHistory = ({
  patientId,
}: {
  patientId: string;
}) => {
  const { t } = useTranslation();
  const { data: patientData, isLoading } = useQuery<Patient>({
    queryKey: ["patient", patientId],
    queryFn: query(routes.patient.getPatient, {
      pathParams: {
        id: patientId,
      },
    }),
    enabled: !!patientId,
  });

  if (!patientData) {
    return <div>{t("patient_not_found")}</div>;
  }
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
        <SymptomsTimeline />
      </div>
    </>
  );
};
