import * as Notification from "../../Utils/Notifications.js";
import CareIcon from "../../CAREUI/icons/CareIcon.js";
import { ConsultationModel } from "../Facility/models";
import { useSelector, useDispatch } from "react-redux";
import { useEffect, useState } from "react";
import { UserRole } from "../../Common/constants";
import { getConsultationBed, togglePatientPrivacy } from "../../Redux/actions";
interface PatientPricacyToggleProps {
  consultationId: string;
  consultation?: ConsultationModel;
  fetchPatientData: ((state: { aborted: boolean }) => void) | undefined;
}
export default function PatientPricacyToggle(props: PatientPricacyToggleProps) {
  const { consultationId, consultation, fetchPatientData } = props;
  const [privacy, setPrivacy] = useState<boolean>(false);
  const state: any = useSelector((state) => state);
  const dispatch: any = useDispatch();
  const { currentUser } = state;
  const allowPrivacyToggle = () => {
    const currentUserType: UserRole = currentUser.data.user_type;
    if (
      currentUserType == "DistrictAdmin" ||
      currentUserType == "StateAdmin" ||
      currentUserType == "LocalBodyAdmin" ||
      (currentUserType == "Doctor" &&
        currentUser?.data?.home_facility === consultation?.facility) ||
      currentUserType == "Staff" ||
      currentUserType == "WardAdmin"
    )
      return true;

    return false;
  };

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
  if (allowPrivacyToggle() && consultation?.current_bed?.id)
    return (
      <div className="flex flex-row justify-start gap-2">
        <div className="tooltip bg-gray-200 px-3 py-2 font-semibold">
          Privacy Mode: {privacy ? "ON" : "OFF"}
          <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm">
            privacy setting for camera feed visual
          </span>
        </div>
        {!privacy ? (
          <button
            className=" tooltip items-center rounded-md bg-red-500 p-1 text-gray-200 hover:bg-gray-200 hover:text-red-500"
            onClick={togglePrivacy}
          >
            <CareIcon className="care-l-lock text-3xl" />
            <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm">
              Lock Privacy
            </span>
          </button>
        ) : (
          <div
            className="tooltip items-center rounded-md bg-gray-500 p-1 text-gray-200 hover:bg-gray-200 hover:text-black"
            onClick={togglePrivacy}
          >
            <CareIcon className="care-l-unlock text-3xl" />
            <span className="tooltip-text tooltip-top -translate-x-1/2 text-sm">
              Unlock Privacy
            </span>
          </div>
        )}
      </div>
    );

  return <></>;
}
