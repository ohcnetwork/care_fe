import { Button } from "@material-ui/core";
import { navigate } from "hookrouter";
import moment from 'moment';
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { PATIENT_CATEGORY, SYMPTOM_CHOICES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultationDailyRoundsDetails } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, patientId, consultationId, id } = props;
  const dispatch: any = useDispatch();
  const [dailyRoundListDetailsData, setDailyRoundListDetails] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const dailyRoundListDetails = await dispatch(getConsultationDailyRoundsDetails(id, { consultationId }));
      if (!status.aborted) {
        if (dailyRoundListDetails && dailyRoundListDetails.data) {
          setDailyRoundListDetails(dailyRoundListDetails.data);
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

  const showAdditionalSymtoms = () => {
    let additionalSymtomsValue: any = '';
    if ((dailyRoundListDetailsData.additional_symptoms) && (dailyRoundListDetailsData.additional_symptoms.length > 0)) {
      for (let i = 0; i < dailyRoundListDetailsData.additional_symptoms.length; i++) {
        let symptomValue: any = SYMPTOM_CHOICES.find((symtomObj: any) => {
          return (symtomObj.id === dailyRoundListDetailsData.additional_symptoms[i]);
        })
        additionalSymtomsValue += (symptomValue && symptomValue.text + ', ')
      }
    }
    return additionalSymtomsValue;
  }

  function findPatientCategory() {
    let categoryValue: any = PATIENT_CATEGORY.find((value: any) => {
      return (value.id === dailyRoundListDetailsData.patient_category);
    });
    return categoryValue ? categoryValue.text : '';
  }

  return (
    <div className="px-2">
      <PageTitle title={`Daily Rounds #${id}`} />
      <div className="border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="max-w-md">
            <div>
              <span className="font-semibold leading-relaxed">Patient Category: </span>
              {findPatientCategory()}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Current Health: </span>
              {dailyRoundListDetailsData.current_health}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="small"
                onClick={() =>
                  navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds-list/${id}/update`)
                }
              >Update Details</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div>
            <span className="font-semibold leading-relaxed">Additional Symptoms: </span>
            {showAdditionalSymtoms()}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Temperature: </span>
            {dailyRoundListDetailsData.temperature}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Temperature Measured At: </span>
            {dailyRoundListDetailsData.temperature_measured_at ? moment(dailyRoundListDetailsData.temperature_measured_at).format('lll') : 'Not Available'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Physical Examination Info: </span>
            {dailyRoundListDetailsData.physical_examination_info}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Other Symptoms: </span>
            {dailyRoundListDetailsData.other_symptoms}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Recommend Discharge: </span>
            {dailyRoundListDetailsData.recommend_discharge}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Other Details: </span>
            {dailyRoundListDetailsData.other_details}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Consultation: </span>
            {dailyRoundListDetailsData.consultation}
          </div>
        </div>

      </div>
    </div>
  );
};
