import React, { useState } from "react";
import axios from "axios";

export default function ShowPushNotification(props: any) {
  const [isLoading, setIsLoading] = useState(true);
  const { data }: any = props;
  const getNotificationData = async () => {
    const res = await axios.get(`/api/v1/notification/${data.id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("care_access_token")}`,
      },
    });
    return res.data;
  };

  let resultUrl = async () => {
    setIsLoading(true);
    const res = await getNotificationData();
    const data = res.caused_objects;
    switch (res.event) {
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
