import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { getNotificationData } from "../../Redux/actions";

export default function ShowPushNotification({ external_id }: any) {
  const [isLoading, setIsLoading] = useState(true);
  const dispatch: any = useDispatch();

  let resultUrl = async () => {
    setIsLoading(true);
    console.log("ID:", external_id.id);
    const res = await dispatch(getNotificationData({ id: external_id.id }));
    const data = res.data.caused_objects;
    switch (res.data.event) {
      case "PATIENT_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.session}`;
      case "MESSAGE":
        return `/`;
      default:
        return "#";
    }
  };

  resultUrl()
    .then((url) => {
      setIsLoading(false);
      window.location.href = url;
    })
    .catch((err) => console.log(err));

  return <></>;
}
