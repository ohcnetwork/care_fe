import React, { useEffect, useState } from "react";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import { UserAssignedModel } from "../Users/models";
import { SkillObjectModel } from "../Users/models";
import CareIcon, { IconName } from "../../CAREUI/icons/CareIcon";
import { relativeTime } from "../../Utils/utils";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { triggerGoal } from "../../Integrations/Plausible";
import { Warn } from "../../Utils/Notifications";
import Switch from "../../CAREUI/interactive/Switch";
import useQuery from "../../Utils/request/useQuery";
import routes from "../../Redux/api";

enum FilterTypes {
  ALL = "All",
  DOCTOR = "Doctor",
  NURSE = "Nurse",
  TELEICU = "TeleICU Hub",
}

const isHomeUser = (user: UserAssignedModel, facilityId: string) =>
  user.home_facility_object?.id === facilityId;

export default function DoctorVideoSlideover(props: {
  show: boolean;
  facilityId: string;
  setShow: (show: boolean) => void;
}) {
  const { show, facilityId, setShow } = props;
  const [filteredDoctors, setFilteredDoctors] = useState<UserAssignedModel[]>(
    []
  );
  const [filter, setFilter] = useState<FilterTypes>(FilterTypes.ALL);

  const { data: users, loading } = useQuery(routes.getFacilityUsers, {
    prefetch: show,
    pathParams: { facility_id: facilityId },
    query: { limit: 50 },
  });

  useEffect(() => {
    const filterDoctors = (users: UserAssignedModel[]) => {
      return users.filter(
        (user: UserAssignedModel) =>
          (user.alt_phone_number || user.video_connect_link) &&
          (user.user_type === "Doctor" || user.user_type === "Nurse") &&
          (filter === FilterTypes.ALL ||
            (filter === FilterTypes.DOCTOR &&
              isHomeUser(user, facilityId) &&
              user.user_type === "Doctor") ||
            (filter === FilterTypes.NURSE &&
              isHomeUser(user, facilityId) &&
              user.user_type === "Nurse") ||
            (filter === FilterTypes.TELEICU && !isHomeUser(user, facilityId)))
      );
    };
    if (users?.results && !loading) {
      setFilteredDoctors(
        filterDoctors(users.results).sort(
          (a: UserAssignedModel, b: UserAssignedModel) => {
            const aIsHomeUser = isHomeUser(a, facilityId);
            const bIsHomeUser = isHomeUser(b, facilityId);
            return aIsHomeUser === bIsHomeUser ? 0 : aIsHomeUser ? -1 : 1;
          }
        )
      );
    }
  }, [facilityId, filter, loading, users?.results]);

  return (
    <SlideOver
      open={show}
      setOpen={setShow}
      title="Doctor Connect"
      dialogClass="md:w-[450px]"
    >
      {/* Title and close button */}
      <p className="-mt-3 pb-4 text-sm text-gray-600">
        Select a doctor to connect via video
      </p>
      <div className="flex justify-center">
        <Switch
          tabs={
            Object.values(FilterTypes).reduce(
              (acc, type) => ({ ...acc, [type]: type }),
              {}
            ) as Record<FilterTypes, string>
          }
          selected={filter}
          onChange={(tab) => setFilter(tab)}
          size="md"
        />
      </div>
      {filteredDoctors.map((doctor, i) => (
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
  const icon: IconName =
    user.user_type === "Doctor" ? "l-user-md" : "l-user-nurse";

  function connectOnWhatsApp(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
    if (!user.alt_phone_number) return;
    const phoneNumber = user.alt_phone_number;
    const message = `Hey ${user.first_name} ${user.last_name}, I have a query regarding a patient.\n\nPatient Link: ${window.location.href}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappAppURL = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
    const whatsappWebURL = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${encodedMessage}`;

    const userAgent = navigator.userAgent;
    const isEdge = /edge\/\d+/i.test(userAgent);
    const isMobileFirefoxOrSafari =
      /iPhone|iPad|iPod|Android/i.test(userAgent) &&
      (/Firefox/i.test(userAgent) ||
        (/Safari/i.test(userAgent) && !/Chrome/i.test(userAgent)));
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
    const isMobile = /iPhone|iPad|iPod|Android/i.test(userAgent);

    const openWhatsAppWebFallback = () => {
      if (isMobile) {
        Warn({
          msg: "Please install WhatsApp to connect with the doctor",
        });
      }
      window.open(whatsappWebURL, "_blank");
    };

    if (isEdge) {
      if (navigator.msLaunchUri) {
        navigator.msLaunchUri(whatsappAppURL, null, openWhatsAppWebFallback);
      } else {
        openWhatsAppWebFallback();
      }
    } else {
      const attemptOpenWhatsApp = (url: string) => {
        if (isMobileFirefoxOrSafari || isSafari) {
          const iframe = document.createElement("iframe");
          iframe.style.display = "none";
          iframe.src = url;
          document.body.appendChild(iframe);
        } else {
          window.location.href = url;
        }
      };

      attemptOpenWhatsApp(whatsappAppURL);

      const fallbackTimeout = setTimeout(() => {
        openWhatsAppWebFallback();
      }, 1250);

      // Listen for when the window loses focus, indicating app launch success
      window.addEventListener("blur", () => {
        clearTimeout(fallbackTimeout);
      });
    }
  }

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
      <a className="flex" onClick={connectOnWhatsApp}>
        <div className="flex flex-none items-center justify-center sm:h-6 sm:w-6 md:h-10 md:w-10">
          {
            // Show online icon based on last_login
            user.last_login &&
            Number(new Date()) - Number(new Date(user.last_login)) < 60000 ? (
              <CareIcon icon={icon} className="text-xl text-green-600" />
            ) : (
              <CareIcon icon={icon} className="text-2xl text-gray-600" />
            )
          }
        </div>
        <div className="ml-4 flex flex-auto flex-col gap-1">
          <div className="flex justify-between gap-2 text-sm font-medium text-gray-700">
            <span>
              {user.first_name} {user.last_name}
              <span className="pl-1 font-normal text-gray-700">
                (
                {isHomeUser(user, facilityId)
                  ? user.user_type
                  : `TeleICU Hub ${user.user_type}`}
                )
              </span>
            </span>
            <DoctorConnectButtons user={user} />
          </div>
          {!!user.skills.length && (
            <div className="mt-1 text-sm leading-5 text-gray-900">
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill: SkillObjectModel) => (
                  <span
                    key={skill.id}
                    className="flex items-center gap-2 rounded-full border-gray-300 bg-gray-200 px-3 text-xs text-gray-900"
                  >
                    <p className="py-1.5">{skill.name}</p>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between gap-2 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <a
                role="button"
                href="#"
                onClick={async () =>
                  await navigator.clipboard.writeText(
                    user?.alt_phone_number || ""
                  )
                }
              >
                <span className="tooltip">
                  <span className="tooltip-text tooltip-top">
                    Copy Phone number
                  </span>
                  <CareIcon className="care-l-clipboard h-5 w-5" />
                </span>
              </a>
              <span>{user.alt_phone_number}</span>
            </div>
            <div className="text-sm text-gray-500">
              {user.last_login && <span>{relativeTime(user.last_login)}</span>}
            </div>
          </div>
        </div>
      </a>
    </li>
  );
}

function DoctorConnectButtons(props: { user: UserAssignedModel }) {
  const user = props.user;
  const authUser = useAuthUser();
  return (
    <div className="flex gap-2">
      {user.video_connect_link && (
        <a
          href={user.video_connect_link}
          onClick={() => {
            triggerGoal("Doctor Connect Click", {
              medium: "Video Call",
              userId: authUser.id,
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
      <a onClick={connectOnWhatsApp}>
        <div className="tooltip">
          <span className="tooltip-text tooltip-right">
            Connect on WhatsApp
          </span>
          <CareIcon className="care-l-whatsapp h-5 w-5" />
        </div>
      </a>
      <a
        href={user.alt_phone_number ? `tel:${user.alt_phone_number}` : "#"}
        onClick={() => {
          triggerGoal("Doctor Connect Click", {
            medium: "Phone Call",
            userId: authUser.id,
            targetUserType: user.user_type,
          });
        }}
      >
        <div className="tooltip">
          <span className="tooltip-text tooltip-right">Connect on Phone</span>
          <CareIcon className="care-l-phone-alt h-5 w-5" />
        </div>
      </a>
    </div>
  );
}
