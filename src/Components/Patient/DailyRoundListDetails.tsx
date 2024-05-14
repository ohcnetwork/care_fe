import { lazy, useState } from "react";
import { CONSCIOUSNESS_LEVEL, SYMPTOM_CHOICES } from "../../Common/constants";
import { DailyRoundsModel } from "./models";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import { formatDateTime } from "../../Utils/utils";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
const Loading = lazy(() => import("../Common/Loading"));
const symptomChoices = [...SYMPTOM_CHOICES];

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, patientId, consultationId, id } = props;
  const [dailyRoundListDetailsData, setDailyRoundListDetails] =
    useState<DailyRoundsModel>({});

  const { loading: isLoading } = useQuery(routes.getDailyReport, {
    pathParams: { consultationId, id },
    onResponse: ({ res, data }) => {
      if (res && data) {
        const tdata: DailyRoundsModel = {
          ...data,
          temperature: Number(data.temperature) ? data.temperature : "",
          additional_symptoms_text: "",
          medication_given: data.medication_given ?? [],
        };
        if (data.additional_symptoms?.length) {
          const symptoms = data.additional_symptoms.map((symptom: number) => {
            const option = symptomChoices.find((i) => i.id === symptom);
            return option ? option.text.toLowerCase() : symptom;
          });
          tdata.additional_symptoms_text = symptoms.join(", ");
        }
        setDailyRoundListDetails(tdata);
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
              Additional Symptoms:{" "}
            </span>
            {dailyRoundListDetailsData.additional_symptoms_text ?? "-"}
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
              Other Symptoms:{" "}
            </span>
            {dailyRoundListDetailsData.other_symptoms ?? "-"}
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
          <div className="md:col-span-2 ">
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
            {dailyRoundListDetailsData.consciousness_level
              ? CONSCIOUSNESS_LEVEL.find(
                  (i) => i.id === dailyRoundListDetailsData.consciousness_level,
                )?.text
              : "-"}
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
