import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import { getFacilityUsers } from "../../Redux/actions";
import { UserAssignedModel } from "../Users/models";
import { SkillObjectModel } from "../Users/models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { relativeTime } from "../../Utils/utils";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { triggerGoal } from "../../Integrations/Plausible";
import Chip from "../../CAREUI/display/Chip";

const isHomeUser = (user: UserAssignedModel, facilityId: string) =>
  user.home_facility_object?.id === facilityId;

export default function DoctorVideoSlideover(props: {
  show: boolean;
  facilityId: string;
  setShow: (show: boolean) => void;
}) {
  const { show, facilityId, setShow } = props;
  const [doctors, setDoctors] = useState<UserAssignedModel[]>([]);

  const dispatchAction: any = useDispatch();
  useEffect(() => {
    const fetchUsers = async () => {
      if (facilityId) {
        const res = await dispatchAction(
          getFacilityUsers(facilityId, { limit: 50 })
        );
        if (res?.data) {
          setDoctors(
            res.data.results
              .filter(
                (user: UserAssignedModel) =>
                  (user.alt_phone_number || user.video_connect_link) &&
                  (user.user_type === "Doctor" || user.user_type === "Nurse")
              )
              .sort((a: UserAssignedModel, b: UserAssignedModel) => {
                const aIsHomeUser = isHomeUser(a, facilityId);
                const bIsHomeUser = isHomeUser(b, facilityId);
                return aIsHomeUser === bIsHomeUser
                  ? 0
                  : isHomeUser(a, facilityId)
                  ? -1
                  : 1;
              })
          );
        }
      } else {
        setDoctors([]);
      }
    };
    if (show) {
      fetchUsers();
    }
  }, [show, facilityId]);

  return (
    <SlideOver
      open={show}
      setOpen={setShow}
      title="Doctor Connect"
      dialogClass="md:w-[400px]"
    >
      {/* Title and close button */}
      <p className="-mt-3 pb-4 text-sm text-gray-600">
        Select a doctor to connect via video
      </p>
      <div className="flex items-center justify-center gap-2">
        {/* 
      TODO: Add a filter to show Doctors, Nurses, and TeleICU Hub separately
       */}
        <Chip text="Doctors" size="medium" />
        <Chip text="Nurse" size="medium" />
        <Chip text="TeleICU Hub" size="medium" />
      </div>
      {doctors.map((doctor, i) => (
        <div
          key={i}
          className="mb-4"
          id={`doctor-connect-${
            isHomeUser(doctor, facilityId) ? "home" : "remote"
          }-${doctor.user_type.toLowerCase()}`}
        >
          <ul className="mt-3 max-h-96 list-none" id="options" role="listbox">
            <UserListItem
              key={doctor.id}
              user={doctor}
              facilityId={facilityId}
            />
          </ul>
        </div>
      ))}
    </SlideOver>
  );
}

function UserListItem(props: { user: UserAssignedModel; facilityId: string }) {
  const user = props.user;
  const facilityId = props.facilityId;
  const icon =
    user.user_type === "Doctor" ? "fa-user-doctor " : " fa-user-nurse";
  const authUser = useAuthUser();

  return (
    <li
      key={user.id}
      className={
        "group cursor-default select-none rounded-xl p-3 " +
        (user.alt_phone_number
          ? "cursor-pointer border border-gray-400 transition hover:border-green-500 hover:bg-green-50"
          : "pointer-events-none cursor-not-allowed bg-gray-400 ")
      }
      id="option-1"
      role="option"
      tabIndex={-1}
    >
      <a
        href={
          user.alt_phone_number
            ? `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
                user.alt_phone_number
              )}&text=${encodeURIComponent(
                `Hey ${user.first_name} ${user.last_name}, I have a query regarding a patient.\n\nPatient Link: ${window.location.href}`
              )}`
            : "#"
        }
        target="_blank"
        rel="noopener noreferrer"
        className="flex"
      >
        <div className="flex flex-none items-center justify-center sm:h-6 sm:w-6 md:h-10 md:w-10">
          {
            // Show online icon based on last_login
            user.last_login &&
            Number(new Date()) - Number(new Date(user.last_login)) < 60000 ? (
              <i className={`fa-solid text-xl text-green-600 ${icon}`}></i>
            ) : (
              <i className={`fa-solid text-2xl text-gray-600 ${icon}`}></i>
            )
          }
        </div>
        <div className="ml-4 flex-auto">
          <p className="flex justify-between gap-2 text-sm font-medium text-gray-700">
            <span>
              {user.first_name} {user.last_name}
            </span>
            <Chip
              text={
                isHomeUser(user, facilityId)
                  ? user.user_type
                  : `TeleICU Hub ${user.user_type}`
              }
              size="small"
            />
          </p>
          {!!user.skills.length && (
            <div className="mt-1 text-sm leading-5 text-gray-900">
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill: SkillObjectModel) => (
                  <span className="flex items-center gap-2 rounded-full border-gray-300 bg-gray-200 px-3 text-xs text-gray-900">
                    <p className="py-1.5">{skill.name}</p>
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="flex gap-2 text-sm text-gray-500">
            <a
              role="button"
              href="#"
              onClick={async () =>
                await navigator.clipboard.writeText(
                  user?.alt_phone_number || ""
                )
              }
            >
              <div className="tooltip">
                <span className="tooltip-text tooltip-top">
                  Copy Phone number
                </span>
                <CareIcon className="care-l-clipboard h-5 w-5" />
              </div>
            </a>
            <span>{user.alt_phone_number}</span>
          </p>
          <div className="flex justify-between gap-2 text-sm text-gray-500">
            <div className="flex gap-2">
              {user.video_connect_link && (
                <a
                  href={user.video_connect_link}
                  onClick={() => {
                    triggerGoal("Doctor Connect Click", {
                      medium: "Video Call",
                      userId: authUser?.id,
                      targetUserType: user.user_type,
                    });
                  }}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-right">
                      Connect on a Video Call
                    </span>
                    <CareIcon icon="l-video" className="h-5 w-5" />
                  </div>
                </a>
              )}
              <a
                href={
                  user.alt_phone_number
                    ? `https://api.whatsapp.com/send/?phone=${encodeURIComponent(
                        user.alt_phone_number
                      )}&text=${encodeURIComponent(
                        `Hey ${user.first_name} ${user.last_name}, I have a query regarding a patient.\n\nPatient Link: ${window.location.href}`
                      )}`
                    : "#"
                }
                onClick={() => {
                  triggerGoal("Doctor Connect Click", {
                    medium: "WhatsApp",
                    userId: authUser?.id,
                    targetUserType: user.user_type,
                  });
                }}
                target="_blank"
                rel="noopener noreferrer"
              >
                <div className="tooltip">
                  <span className="tooltip-text tooltip-right">
                    Connect on WhatsApp
                  </span>
                  <CareIcon className="care-l-whatsapp h-5 w-5" />
                </div>
              </a>
              <a
                href={
                  user.alt_phone_number ? `tel:${user.alt_phone_number}` : "#"
                }
                onClick={() => {
                  triggerGoal("Doctor Connect Click", {
                    medium: "Phone Call",
                    userId: authUser?.id,
                    targetUserType: user.user_type,
                  });
                }}
              >
                <div className="tooltip">
                  <span className="tooltip-text tooltip-right">
                    Connect on Phone
                  </span>
                  <CareIcon className="care-l-phone-alt h-5 w-5" />
                </div>
              </a>
            </div>
            {user.last_login && <span>{relativeTime(user.last_login)}</span>}
          </div>
        </div>
      </a>
    </li>
  );
}
