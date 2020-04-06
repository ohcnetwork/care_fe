import { Button, CircularProgress, Grid, Typography } from "@material-ui/core";
import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {  getConsultationDailyRoundsDetails, patchSample } from "../../Redux/actions";
import * as Notification from "../../Utils/Notifications";
import AlertDialog from "../Common/AlertDialog";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, id, patientId, consultationId, dailyRoundListId } = props;
  const dispatch: any = useDispatch();
  const [dailyRoundListDetailsData, setDailyRoundListDetails] = useState< {
    id?: number;
    additional_symptoms?: object;
    patient_category?: string;
    current_health?: number ;
    temperature?: string;
    temperature_measured_at?: string ;
    physical_examination_info?: string;
    other_symptoms?: string;
    recommend_discharge?: boolean;
    other_details?: string;
    consultation?: number;
  }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [sampleFlag, callSampleList] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<{ status: number, sample: any }>({ status: 0, sample: null });
  const [showAlertMessage, setAlertMessage] = useState({
    show: false,
    message: "",
    title: "",
  });

  const limit = 5;

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const dailyRoundListDetails = await dispatch(getConsultationDailyRoundsDetails({ dailyRoundListId,consultationId }));
      if (!status.aborted) {
        if (dailyRoundListDetails && dailyRoundListDetails.data) {
          setDailyRoundListDetails(dailyRoundListDetails.data);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  const dismissAlert = () => {
    setAlertMessage({
      show: false,
      message: "",
      title: "",
    })
  };

  const handleApproval = () => {
    const { status, sample } = selectedStatus;
    const sampleData = {
      id: sample.id,
      status,
      consultation: sample.consultation
    };
    let statusName = "";
    if (status === 4) {
      statusName = "SENT_TO_COLLECTON_CENTRE";
    }

    dispatch(patchSample(Number(sample.id), sampleData)).then((resp: any) => {
      if (resp.status === 201 || resp.status === 200) {
        Notification.Success({
          msg: `Request ${statusName}`
        });
        // window.location.reload();
        callSampleList(!sampleFlag);
      }
    });

    dismissAlert()
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      {showAlertMessage.show && (
        <AlertDialog
          title={showAlertMessage.title}
          message={showAlertMessage.message}
          handleClose={() => handleApproval()}
          handleCancel={() => dismissAlert()}
        />
      )}
      <PageTitle title={`Daily Rounds #${dailyRoundListId}`} />
      <div className="border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="max-w-md">
          <div>
              <span className="font-semibold leading-relaxed">Patient Category: </span>
              {dailyRoundListDetailsData.patient_category}
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
                    navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds-list/${dailyRoundListId}/update`)
                }
              >Update Details</Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          <div>
            <span className="font-semibold leading-relaxed">Temperature: </span>
            {dailyRoundListDetailsData.temperature}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Temperature Measured At: </span>
            {dailyRoundListDetailsData.temperature_measured_at}
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
