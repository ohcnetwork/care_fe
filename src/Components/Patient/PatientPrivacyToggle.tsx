import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import { ConsultationModel } from "../Facility/models.js";
import { useEffect, useState } from "react";
import { UserRole } from "../../Common/constants.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
import request from "../../Utils/request/request.js";
import routes from "../../Redux/api.js";
interface PatientPrivacyToggleProps {
  consultationId: string;
  consultation?: ConsultationModel | null;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}
export default function PatientPrivacyToggle(props: PatientPrivacyToggleProps) {
  const { consultationId, consultation, fetchPatientData } = props;
  const [privacy, setPrivacy] = useState<boolean>(false);
  const user = useAuthUser();

  //condititonally render the privacy toggle button depending on user role
  const allowPrivacyToggle = () => {
    const currentUserType: UserRole = user.user_type;
    if (
      currentUserType == "DistrictAdmin" ||
      currentUserType == "StateAdmin" ||
      currentUserType == "LocalBodyAdmin" ||
      (currentUserType == "Doctor" &&
        user?.home_facility_object?.id === consultation?.facility) ||
      (currentUserType == "Staff" &&
        user?.home_facility_object?.id === consultation?.facility) ||
      currentUserType == "WardAdmin"
    )
      return true;

    return false;
  };
  //hook to fetch the privacy info of the patient
  useEffect(() => {
    const getPrivacyInfo = async () => {
      if (
        consultation?.current_bed?.privacy == true ||
        consultation?.current_bed?.privacy == false
      ) {
        setPrivacy(consultation?.current_bed?.privacy);
        return;
      }
      const bedId = consultation?.current_bed?.bed_object?.id;
      const consultationBedID = consultation?.current_bed?.id ?? "";
      try {
        const { res, data } = await request(routes.getConsultationBed, {
          body: { consultation: consultationId, bed: bedId },
          pathParams: { external_id: consultationBedID },
        });

        if (
          res &&
          res.status === 200 &&
          data &&
          (data?.privacy == true || data?.privacy == false)
        ) {
          setPrivacy(data.privacy);
        } else {
          Notification.Error({
            msg: "Failed to fetch privacy",
          });
        }
      } catch (e) {
        Notification.Error({
          msg: "Something went wrong..!",
        });
      }
    };
    if (
      consultation &&
      consultationId &&
      consultation?.current_bed?.id &&
      consultation?.current_bed?.bed_object?.id
    ) {
      getPrivacyInfo();
    }

    // disable privacy beforeunload window event handler
    window.addEventListener("beforeunload", () => {
      if (allowPrivacyToggle() && privacy) {
        disablePrivacy();
      }
    });
  }, [consultation, allowPrivacyToggle, privacy]);

  //function to enable the privacy of the patient
  const enablePrivacy = async () => {
    try {
      if (consultation?.current_bed?.id) {
        const { res, data } = await request(routes.enablePatientPrivacy, {
          pathParams: {
            external_id: consultation?.current_bed?.id as string,
          },
        });

        if (res && res.status === 200) {
          setPrivacy(!privacy);
          Notification.Success({
            msg: "Privacy enabled successfully",
          });
          if (fetchPatientData) fetchPatientData({ aborted: false });
        } else if (res && res.status === 403) {
          Notification.Error({
            msg: data?.detail,
          });
        } else {
          Notification.Error({
            msg: "Failed to update privacy",
          });
        }
      }
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
  };

  //function to disable the privacy of the patient
  const disablePrivacy = async () => {
    try {
      if (consultation?.current_bed?.id) {
        const { res, data } = await request(routes.disablePatientPrivacy, {
          pathParams: {
            external_id: consultation?.current_bed?.id as string,
          },
        });

        if (res && res.status === 200) {
          setPrivacy(!privacy);
          Notification.Success({
            msg: "Privacy disabled successfully",
          });
          if (fetchPatientData) fetchPatientData({ aborted: false });
        } else if (res && res.status === 403) {
          Notification.Error({
            msg: data?.detail,
          });
        } else {
          Notification.Error({
            msg: "Failed to update privacy",
          });
        }
      }
    } catch (e) {
      Notification.Error({
        msg: "Something went wrong..!",
      });
    }
  };

  if (!allowPrivacyToggle() || !consultation?.current_bed?.id) {
    return <></>;
  }

  return (
    <div className="flex flex-row justify-start gap-2 pt-2">
      <div className="tooltip rounded-md bg-gray-300  px-3 py-2 text-sm font-semibold">
        Privacy Mode: {privacy ? "ON" : "OFF"}
        <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm">
          Privacy setting for camera feed visual
        </span>
      </div>
      <button
        className={`tooltip items-center rounded-md bg-gray-300 p-1 ${
          privacy
            ? "text-black hover:bg-gray-500"
            : "text-red-500 hover:bg-red-500"
        } hover:text-gray-200`}
        onClick={privacy ? disablePrivacy : enablePrivacy}
        id="privacy-toggle"
      >
        <CareIcon
          className={`${privacy ? "care-l-unlock" : "care-l-lock"} text-3xl`}
        />
        <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm">
          {privacy ? "Unlock" : "Lock"} Privacy
        </span>
      </button>
    </div>
  );
}
