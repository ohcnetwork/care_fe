import { useState } from "react";
import { useTranslation } from "react-i18next";

import ButtonV2 from "@/components/Common/ButtonV2";
import Loading from "@/components/Common/Loading";
import Page from "@/components/Common/Page";
import { DailyRoundsModel } from "@/components/Patient/models";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

export const DailyRoundListDetails = (props: any) => {
  const { t } = useTranslation();
  const { facilityId, patientId, consultationId, id } = props;
  const [dailyRoundListDetailsData, setDailyRoundListDetails] =
    useState<DailyRoundsModel>({});

  const { loading: isLoading } = useQuery(routes.getDailyReport, {
    pathParams: { consultationId, id },
    onResponse: ({ data }) => {
      if (data) {
        setDailyRoundListDetails(data);
      }
    },
  });

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={t("log_update") + ` #${id}`}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/log_updates`}
    >
      <div
        className="mt-4 h-full rounded-lg border border-gray-300 bg-white p-6 text-gray-800 shadow-sm hover:shadow-md hover:border-primary-500"
        id="consultation-preview"
      >
        <div className="flex justify-between items-center border-b pb-4 mb-4">
          <div className="max-w-md">
            <div>
              <span className="text-lg font-medium">Patient Category: </span>
              <span className="text-lg text-gray-600">
                {dailyRoundListDetailsData.patient_category ?? "-"}
              </span>
            </div>
          </div>
          <ButtonV2
            href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/log_updates/${id}/update`}
          >
            Update Details
          </ButtonV2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[
            {
              label: "Temperature",
              value: dailyRoundListDetailsData.temperature,
            },
            {
              label: "Taken at",
              value: dailyRoundListDetailsData.taken_at
                ? formatDateTime(dailyRoundListDetailsData.taken_at)
                : "-",
            },
            { label: "SpO2", value: dailyRoundListDetailsData.ventilator_spo2 },
            {
              label: "Admitted To *",
              value: dailyRoundListDetailsData.admitted_to,
            },
            {
              label: "Physical Examination Info",
              value: dailyRoundListDetailsData.physical_examination_info,
            },
            {
              label: "Other Details",
              value: dailyRoundListDetailsData.other_details,
            },
            { label: "Pulse (bpm)", value: dailyRoundListDetailsData.pulse },
            {
              label: "BP",
              value: (
                <div className="flex space-x-10">
                  <span>
                    Systolic: {dailyRoundListDetailsData.bp?.systolic ?? "-"}
                  </span>
                  <span>
                    Diastolic: {dailyRoundListDetailsData.bp?.diastolic ?? "-"}
                  </span>
                </div>
              ),
            },
            {
              label: "Respiratory Rate (bpm)",
              value: dailyRoundListDetailsData.resp,
            },
            { label: "Rhythm", value: dailyRoundListDetailsData.rhythm },
            {
              label: "Rhythm Description",
              value: dailyRoundListDetailsData.rhythm_detail,
            },
            {
              label: "Level Of Consciousness",
              value: dailyRoundListDetailsData.consciousness_level
                ? t(
                    `CONSCIOUSNESS_LEVEL__${dailyRoundListDetailsData.consciousness_level}`,
                  )
                : "-",
            },
            {
              label: "Recommend Discharge",
              value: dailyRoundListDetailsData.recommend_discharge ? (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-yellow-800 bg-yellow-100 rounded-full">
                  Yes
                </span>
              ) : (
                <span className="inline-block px-3 py-1 text-xs font-semibold text-gray-600 bg-gray-200 rounded-full">
                  No
                </span>
              ),
            },
          ].map(({ label, value }, index) => (
            <div
              key={index}
              className="p-4 border rounded-md bg-gray-50 hover:bg-gray-100"
            >
              <span className="block text-sm font-semibold text-gray-700">
                {label}:
              </span>
              <span className="block text-sm text-gray-600">
                {value ?? "-"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
};
