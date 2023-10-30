// import { useDispatch } from "react-redux";
// import { getNotificationData } from "../../Redux/actions";
// import { useEffect } from "react";
// import { DetailRoute } from "../../Routers/types";
//
// export default function ShowPushNotification({ id }: DetailRoute) {
//   const dispatch: any = useDispatch();
//
//   const resultUrl = async () => {
//     const res = await dispatch(getNotificationData({ id }));
//     const data = res.data.caused_objects;
//     switch (res.data.event) {
//       case "PATIENT_CREATED":
//         return `/facility/${data.facility}/patient/${data.patient}`;
//       case "PATIENT_UPDATED":
//         return `/facility/${data.facility}/patient/${data.patient}`;
//       case "PATIENT_CONSULTATION_CREATED":
//         return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
//       case "PATIENT_CONSULTATION_UPDATED":
//         return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
//       case "PATIENT_CONSULTATION_UPDATE_CREATED":
//         return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
//       case "PATIENT_CONSULTATION_UPDATE_UPDATED":
//         return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
//       case "INVESTIGATION_SESSION_CREATED":
//         return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.session}`;
//       case "MESSAGE":
//         return "/notice_board/";
//       default:
//         return "#";
//     }
//   };
//
//   useEffect(() => {
//     resultUrl()
//       .then((url) => {
//         window.location.href = url;
//       })
//       .catch((err) => console.log(err));
//   }, []);
//
//   return <></>;
// }

import { useEffect } from "react";
import { DetailRoute } from "../../Routers/types";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

export default function ShowPushNotification({ id }: DetailRoute) {
  const { data: res, error } = useQuery(routes.getNotificationData, {
    pathParams: { id },
  });

  useEffect(() => {
    const handleNotificationClick = () => {
      if (error) {
        console.error("Error fetching notification data:", error);
        return;
      }

      if (res && res.data) {
        const data = res.data;
        const url = generateUrl(data, res.data);
        if (url) {
          window.location.href = url;
        }
      }
    };

    handleNotificationClick();
  }, [res, error]);

  const generateUrl = (data, event) => {
    if (!data) {
      return null;
    }
    switch (event) {
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

  return null;
}
