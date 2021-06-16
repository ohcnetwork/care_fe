import React from "react";
import axios from "axios";

export default function ShowPushNotification(props: { id: any }) {
  const getNotificationData = async () => {
    const t_id = "dba42af0-9c23-405c-84bd-4d2229d5b4b8";
    const res = await axios.get(`/api/v1/notification/${t_id}/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("care_access_token")}`,
      },
    });
    console.log(res);
  };

  getNotificationData();

  return <></>;
}
