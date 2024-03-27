import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import { getFacilityUsers } from "../../Redux/actions";
import { UserAssignedModel } from "../Users/models";
import { SkillObjectModel } from "../Users/models";
import CareIcon, { IconName } from "../../CAREUI/icons/CareIcon";
import { relativeTime } from "../../Utils/utils";
import useAuthUser from "../../Common/hooks/useAuthUser";
import { triggerGoal } from "../../Integrations/Plausible";
import { Warn } from "../../Utils/Notifications";

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
                (user: any) => user.alt_phone_number || user.video_connect_link
              )
              .sort((a: any, b: any) => {
                return Number(a.last_login) - Number(b.last_login);
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
      {[
        {
          title: "Doctors",
          user_type: "Doctor",
          home: true,
        },
        {
          title: "Nurse",
          user_type: "Nurse",
          home: true,
        },
        {
          title: "TeleICU Hub",
          user_type: "Doctor",
          home: false,
        },
      ].map((type, i) => (
        <div
          key={i}
          className="mb-4"
          id={`doctor-connect-${
            type.home ? "home" : "remote"
          }-${type.user_type.toLowerCase()}`}
        >
          <div>
            <span className="text-lg font-semibold">{type.title}</span>
          </div>

          <ul
            className="max-h-96 scroll-py-3 list-none overflow-y-auto py-3"
            id="options"
            role="listbox"
          >
            {doctors
              .filter((doc) => {
                const isHomeUser =
                  (doc.home_facility_object?.id || "") === facilityId;
                return (
                  doc.user_type === type.user_type && isHomeUser === type.home
                );
              })
              .map((doctor) => {
                return <UserListItem key={doctor.id} user={doctor} />;
              })}
          </ul>
        </div>
      ))}
    </SlideOver>
  );
}

type MSLaunchURI = (
  uri: string,
  successCB?: null | (() => void),
  noHandlerCB?: null | (() => void)
) => void;

function UserListItem(props: { user: UserAssignedModel }) {
  const user = props.user;
  const icon: IconName =
    user.user_type === "Doctor" ? "l-user-md" : "l-user-nurse";
  const authUser = useAuthUser();

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
      if ("msLaunchUri" in navigator) {
        const launch = navigator.msLaunchUri as MSLaunchURI;
        launch(whatsappAppURL, null, openWhatsAppWebFallback);
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
    <li>
      <li
        key={user.id}
        className={
          "group mt-2 cursor-default select-none rounded-xl p-3 " +
          (user.alt_phone_number
            ? "cursor-pointer border border-gray-400 transition hover:border-green-500 hover:bg-green-50"
            : "pointer-events-none cursor-not-allowed bg-gray-400 ")
        }
        id="option-1"
        role="option"
        tabIndex={-1}
      >
        <a className="flex" onClick={connectOnWhatsApp}>
          <div className="flex h-10 w-10 flex-none items-center justify-center">
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
          <div className="ml-4 flex-auto">
            <p className="flex justify-between gap-2 text-sm font-medium text-gray-700">
              <span>
                {user.first_name} {user.last_name}
              </span>
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
                      <span className="tooltip-text tooltip-left">
                        Connect on a Video Call
                      </span>
                      <CareIcon icon="l-video" className="h-5 w-5" />
                    </div>
                  </a>
                )}
                <a onClick={connectOnWhatsApp}>
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-left">
                      Connect on WhatsApp
                    </span>
                    <CareIcon icon="l-whatsapp" className="h-5 w-5" />
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
                    <span className="tooltip-text tooltip-left">
                      Connect on Phone
                    </span>
                    <CareIcon icon="l-phone-alt" className="h-5 w-5" />
                  </div>
                </a>
              </div>
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
            <p className="flex gap-2 divide-gray-800 text-sm text-gray-500">
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
                  <CareIcon icon="l-clipboard" className="h-5 w-5" />
                </div>
              </a>
              <span>{user.alt_phone_number}</span>
              {user.last_login && <span>{relativeTime(user.last_login)}</span>}
            </p>
          </div>
        </a>
      </li>
    </li>
  );
}
