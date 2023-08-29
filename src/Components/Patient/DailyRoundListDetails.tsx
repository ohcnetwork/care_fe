import { lazy, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { CURRENT_HEALTH_CHANGE, SYMPTOM_CHOICES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultationDailyRoundsDetails } from "../../Redux/actions";
import { DailyRoundsModel } from "./models";
import Page from "../Common/components/Page";
import ButtonV2 from "../Common/components/ButtonV2";
import { formatDateTime } from "../../Utils/utils";
const Loading = lazy(() => import("../Common/Loading"));
const symptomChoices = [...SYMPTOM_CHOICES];
const currentHealthChoices = [...CURRENT_HEALTH_CHANGE];

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, patientId, consultationId, id } = props;
  const dispatch: any = useDispatch();
  const [dailyRoundListDetailsData, setDailyRoundListDetails] =
    useState<DailyRoundsModel>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getConsultationDailyRoundsDetails({ consultationId, id })
      );
      if (!status.aborted) {
        if (res && res.data) {
          const currentHealth = currentHealthChoices.find(
            (i) => i.text === res.data.current_health
          );

          const data: DailyRoundsModel = {
            ...res.data,
            temperature: Number(res.data.temperature)
              ? res.data.temperature
              : "",
            additional_symptoms_text: "",
            medication_given:
              Object.keys(res.data.medication_given).length === 0
                ? []
                : res.data.medication_given,
            current_health: currentHealth
              ? currentHealth.desc
              : res.data.current_health,
          };
          if (res.data.additional_symptoms?.length) {
            const symptoms = res.data.additional_symptoms.map(
              (symptom: number) => {
                const option = symptomChoices.find((i) => i.id === symptom);
                return option ? option.text.toLowerCase() : symptom;
              }
            );
            data.additional_symptoms_text = symptoms.join(", ");
          }
          setDailyRoundListDetails(data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, id]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Page
      title={`Consultation Update #${id}`}
      backUrl={`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds`}
    >
      <div className="mt-4 h-full rounded-lg border bg-white p-4 text-black shadow hover:border-primary-500">
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
