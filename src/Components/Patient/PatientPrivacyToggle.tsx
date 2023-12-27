import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import { ConsultationModel } from "../Facility/models.js";
import { useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { UserRole } from "../../Common/constants.js";
import {
  getConsultationBed,
  togglePatientPrivacy,
} from "../../Redux/actions.js";
import useAuthUser from "../../Common/hooks/useAuthUser.js";
interface PatientPrivacyToggleProps {
  consultationId: string;
  consultation?: ConsultationModel | null;
  fetchPatientData?: (state: { aborted: boolean }) => void;
}
export default function PatientPrivacyToggle(props: PatientPrivacyToggleProps) {
  const { consultationId, consultation, fetchPatientData } = props;
  const [privacy, setPrivacy] = useState<boolean>(false);
  const user = useAuthUser();
  const dispatch: any = useDispatch();

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
      const consultationBedID = consultation?.current_bed?.id;
      try {
        const res = await dispatch(
          getConsultationBed(
            consultationId,
            bedId as string,
            consultationBedID as string
          )
        );
        if (
          res &&
          res.status === 200 &&
          res?.data &&
          (res.data?.privacy == true || res.data?.privacy == false)
        ) {
          setPrivacy(res.data.privacy);
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
  }, [consultation]);

  //function to toggle the privacy of the patient
  const togglePrivacy = async () => {
    try {
      if (consultation?.current_bed?.id) {
        const res = await dispatch(
          togglePatientPrivacy(consultation?.current_bed?.id as string)
        );
        if (res && res.status === 200) {
          setPrivacy(!privacy);
          Notification.Success({
            msg: "Privacy updated successfully",
          });
          if (fetchPatientData) fetchPatientData({ aborted: false });
        } else if (res && res.status === 403) {
          Notification.Error({
            msg: res.data.detail,
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
      {!privacy ? (
        <button
          className=" tooltip items-center rounded-md bg-gray-300 p-1 text-red-500 hover:bg-red-500 hover:text-gray-200"
          onClick={togglePrivacy}
          id="privacy-toggle"
        >
          <CareIcon className="care-l-lock text-3xl" />
          <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm">
            Lock Privacy
          </span>
        </button>
      ) : (
        <button
          className="tooltip items-center rounded-md bg-gray-300 p-1 text-black hover:bg-gray-500 hover:text-gray-200"
          onClick={togglePrivacy}
          id="privacy-toggle"
        >
          <CareIcon className="care-l-unlock text-3xl" />
          <span className="tooltip-text tooltip-bottom -translate-x-1/2 text-sm">
            Unlock Privacy
          </span>
        </button>
      )}
    </div>
  );
}
