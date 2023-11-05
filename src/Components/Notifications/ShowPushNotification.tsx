import { DetailRoute } from "../../Routers/types";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";
import { NotificationData } from "./models";

export default function ShowPushNotification({ id }: DetailRoute) {
  useQuery(routes.getNotificationData, {
    pathParams: { id },
    onResponse(res) {
      if (res.data) {
        window.location.href = resultUrl(res.data);
      }
    },
  });

  const resultUrl = (res: NotificationData) => {
    const data = res?.caused_objects;
    switch (res?.event) {
      case "PATIENT_CREATED":
        return `/facility/${data?.facility}/patient/${data?.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${data?.facility}/patient/${data?.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${data?.facility}/patient/${data?.patient}/consultation/${data?.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data?.facility}/patient/${data?.patient}/consultation/${data?.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data?.facility}/patient/${data?.patient}/consultation/${data?.consultation}/daily-rounds/${data?.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data?.facility}/patient/${data?.patient}/consultation/${data?.consultation}/daily-rounds/${data?.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data?.facility}/patient/${data?.patient}/consultation/${data?.consultation}/investigation/${data?.session}`;
      case "MESSAGE":
        return "/notice_board/";
      default:
        return "#";
    }
  };

  return <></>;
}
