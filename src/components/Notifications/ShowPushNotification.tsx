import { NotificationData } from "@/components/Notifications/models";

import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";

export default function ShowPushNotification({ id }: { id: string }) {
  useQuery(routes.getNotificationData, {
    pathParams: { id },
    onResponse(res) {
      if (res.data) {
        window.location.href = resultUrl(res.data);
      }
    },
  });

  const resultUrl = ({ caused_objects, event }: NotificationData) => {
    switch (event) {
      case "PATIENT_CREATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}/consultation/${caused_objects?.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}/consultation/${caused_objects?.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}/consultation/${caused_objects?.consultation}/daily-rounds/${caused_objects?.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}/consultation/${caused_objects?.consultation}/daily-rounds/${caused_objects?.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${caused_objects?.facility}/patient/${caused_objects?.patient}/consultation/${caused_objects?.consultation}/investigation/${caused_objects?.session}`;
      case "PATIENT_NOTE_ADDED":
        return `/facility/${caused_objects.facility}/patient/${caused_objects.patient}/notes`;
      case "MESSAGE":
        return "/notice_board/";
      default:
        return "#";
    }
  };

  return <></>;
}
