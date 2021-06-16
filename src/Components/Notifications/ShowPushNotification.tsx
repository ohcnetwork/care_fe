import React from "react";
import axios from "axios";

export default function ShowPushNotification(props: { id: any }) {
  const getNotificationData = async () => {
    // !!! For testing, REMOVE in PRODUCTION !!!
    const t_id = "dba42af0-9c23-405c-84bd-4d2229d5b4b8";

    const res = await axios.get(`/api/v1/notification/${t_id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("care_access_token")}`,
      },
    });
    return res.data;
  };

  let resultUrl = async () => {
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
    .then((url) => (window.location.href = url))
    .catch((err) => console.log(err));

  return <></>;
}
