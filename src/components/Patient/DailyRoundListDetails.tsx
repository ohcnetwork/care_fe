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
      title={`Consultation Update #${id}`}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds`}
    >
      <div
        className="mt-4 h-full rounded-lg border bg-white p-4 text-black shadow hover:border-primary-500"
        id="consultation-preview"
      >
        <div className="flex justify-between">
          <div className="max-w-md">
            <div>
              <span className="font-semibold leading-relaxed">
                Patient Category:{" "}
              </span>
              {dailyRoundListDetailsData.patient_category ?? "-"}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <ButtonV2
                href={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${id}/update`}
              >
                Update Details
              </ButtonV2>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <span className="font-semibold leading-relaxed">Temperature: </span>
            {dailyRoundListDetailsData.temperature ?? "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Taken at: </span>
            {dailyRoundListDetailsData.taken_at
              ? formatDateTime(dailyRoundListDetailsData.taken_at)
              : "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">SpO2: </span>
            {dailyRoundListDetailsData.ventilator_spo2 ?? "-"}
          </div>
          <div className="capitalize md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Admitted To *:{" "}
            </span>
            {dailyRoundListDetailsData.admitted_to ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Physical Examination Info:{" "}
            </span>
            {dailyRoundListDetailsData.physical_examination_info ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Other Details:{" "}
            </span>
            {dailyRoundListDetailsData.other_details ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Pulse(bpm): </span>
            {dailyRoundListDetailsData.pulse ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">BP</span>
            <div className="flex flex-row space-x-20">
              <div className="flex">
                <span className="font-semibold leading-relaxed">
                  Systolic:{" "}
                </span>
                {dailyRoundListDetailsData.bp?.systolic ?? "-"}
              </div>
              <div className="flex">
                {" "}
                <span className="font-semibold leading-relaxed">
                  Diastolic:
                </span>
                {dailyRoundListDetailsData.bp?.diastolic ?? "-"}
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Respiratory Rate (bpm):
            </span>

            {dailyRoundListDetailsData.resp ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Rhythm: </span>
            {dailyRoundListDetailsData.rhythm ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Rhythm Description:{" "}
            </span>
            {dailyRoundListDetailsData.rhythm_detail ?? "-"}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">
              Level Of Consciousness:{" "}
            </span>
            {(dailyRoundListDetailsData.consciousness_level &&
              t(
                `CONSCIOUSNESS_LEVEL__${dailyRoundListDetailsData.consciousness_level}`,
              )) ||
              "-"}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">
              Recommend Discharge:{" "}
            </span>
            {dailyRoundListDetailsData.recommend_discharge ? (
              <span className="badge badge-pill badge-warning">Yes</span>
            ) : (
              <span className="badge badge-pill badge-secondary">No</span>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
};
