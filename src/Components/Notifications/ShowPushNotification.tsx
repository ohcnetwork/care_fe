import { useDispatch } from "react-redux";
import { getNotificationData } from "../../Redux/actions";
import { useEffect } from "react";
import { DetailRoute } from "../../Routers/types";

export default function ShowPushNotification({ id }: DetailRoute) {
  const dispatch: any = useDispatch();

  const resultUrl = async () => {
    const res = await dispatch(getNotificationData({ id }));
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
        return "/notice_board/";
      default:
        return "#";
    }
  };

  useEffect(() => {
    resultUrl()
      .then((url) => {
        window.location.href = url;
      })
      .catch((err) => console.log(err));
  }, []);

  return <></>;
}
