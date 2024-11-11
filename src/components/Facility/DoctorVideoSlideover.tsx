import React, { useState } from "react";

import CareIcon, { IconName } from "@/CAREUI/icons/CareIcon";
import SlideOver from "@/CAREUI/interactive/SlideOver";
import Switch from "@/CAREUI/interactive/Switch";

import Loading from "@/components/Common/Loading";
import { SkillObjectModel } from "@/components/Users/models";
import { UserAssignedModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import { triggerGoal } from "@/Integrations/Plausible";
import { PLUGIN_Component } from "@/PluginEngine";
import { Warn } from "@/Utils/Notifications";
import routes from "@/Utils/request/api";
import useQuery from "@/Utils/request/useQuery";
import {
  classNames,
  formatName,
  isUserOnline,
  relativeTime,
} from "@/Utils/utils";

const UserGroups = {
  ALL: "All",
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  TELEICU: "TeleICU Doctor",
};

const courtesyTitle = (user: UserAssignedModel) => {
  if (user.user_type === "Doctor") {
    return "Dr." as const;
  }

  return {
    1: "Mr.",
    2: "Ms.",
    3: "Hey",
  }[user.gender!];
};

type UserGroup = keyof typeof UserGroups;

type UserAnnotatedWithGroup = UserAssignedModel & { group?: UserGroup };

const isHomeUser = (user: UserAssignedModel, facilityId: string) =>
  user.home_facility_object?.id === facilityId;
export default function DoctorVideoSlideover(props: {
  show: boolean;
  facilityId: string;
  setShow: (show: boolean) => void;
}) {
  const { show, facilityId, setShow } = props;
  const [filter, setFilter] = useState<UserGroup>("ALL");

  const { data } = useQuery(routes.getFacilityUsers, {
    prefetch: show,
    pathParams: { facility_id: facilityId },
    query: { limit: 50 },
  });

  const getUserGroup = (user: UserAssignedModel) => {
    if (isHomeUser(user, facilityId)) {
      if (user.user_type === "Doctor") return "DOCTOR";
      if (user.user_type === "Nurse") return "NURSE";
    }

    if (user.user_type === "Doctor") return "TELEICU";
  };

  const annotatedUsers: UserAnnotatedWithGroup[] | undefined = data?.results
    .filter((user) => user.alt_phone_number || user.video_connect_link)
    .map((user) => ({ ...user, group: getUserGroup(user) }))
    .filter((user) => !!user.group) as UserAnnotatedWithGroup[];

  return (
    <SlideOver
      open={show}
      setOpen={setShow}
      title="Doctor Connect"
      dialogClass="md:w-[450px]"
    >
      {/* Title and close button */}
      <p className="-mt-3 pb-4 text-sm text-secondary-600">
        Select a doctor to connect via video
      </p>
      <div className="flex justify-center" id="doctor-connect-filter-tabs">
        <Switch
          tabs={UserGroups}
          selected={filter}
          onChange={(tab) => setFilter(tab)}
          size="md"
        />
      </div>

      {!annotatedUsers ? (
        <Loading />
      ) : filter === "ALL" ? (
        <div className="flex flex-col py-2">
          <UserGroupList
            group="DOCTOR"
            users={annotatedUsers}
            showGroupHeading
          />

          <UserGroupList
            group="NURSE"
            users={annotatedUsers}
            showGroupHeading
          />

          <UserGroupList
            group="TELEICU"
            users={annotatedUsers}
            showGroupHeading
          />
        </div>
      ) : (
        <div className="py-6">
          <UserGroupList group={filter} users={annotatedUsers} />
        </div>
      )}
    </SlideOver>
  );
}

const UserGroupList = (props: {
  users: UserAnnotatedWithGroup[];
  group: UserGroup;
  showGroupHeading?: boolean;
}) => {
  const users = props.users.filter((user) => user.group === props.group);

  return (
    <div className="py-2">
      {props.showGroupHeading && (
        <div className="flex w-full items-center pb-2">
          <span className="whitespace-nowrap text-lg font-bold">
            {UserGroups[props.group]}
          </span>
          <div className="mx-6 h-1 w-full bg-secondary-300" />
        </div>
      )}

      {!users.length && (
        <span className="flex w-full justify-center py-2 font-bold text-secondary-500">
          No users in this category
        </span>
      )}

      {!!users.length && (
        <ul className="flex flex-col gap-3" id="options" role="listbox">
          {users.map((user) => (
            <li
              key={user.id}
              role="option"
              id={`doctor-connect-${
                user.group !== "TELEICU" ? "home" : "remote"
              }-${user.user_type.toLowerCase()}`}
            >
              <UserListItem user={user} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

type MSLaunchURI = (
  uri: string,
  successCB?: null | (() => void),
  noHandlerCB?: null | (() => void),
) => void;

function UserListItem({ user }: { user: UserAnnotatedWithGroup }) {
  const icon: IconName =
    user.user_type === "Doctor" ? "l-user-md" : "l-user-nurse";

  function connectOnWhatsApp(e: React.MouseEvent<HTMLAnchorElement>) {
    e.stopPropagation();
    if (!user.alt_phone_number) return;
    const phoneNumber = user.alt_phone_number?.replace(/\D+/g, "");
    const message = `${courtesyTitle(user)} ${formatName(user)}, I have a query regarding a patient.\n\nPatient Link: ${window.location.href}`;
    const encodedMessage = encodeURIComponent(message);
    const whatsappAppURL = `whatsapp://send?phone=${phoneNumber}&text=${encodedMessage}`;
    const whatsappWebURL = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;

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
    <div
      className={classNames(
        "group cursor-default select-none rounded-xl p-3",
        user.alt_phone_number
          ? "cursor-pointer border border-secondary-400 transition hover:border-green-500 hover:bg-green-50"
          : "pointer-events-none cursor-not-allowed bg-secondary-400",
      )}
    >
      <a className="flex" onClick={connectOnWhatsApp}>
        <div className="flex flex-none items-center justify-center sm:h-6 sm:w-6 md:h-10 md:w-10">
          {
            // Show online icon based on last_login
            user.last_login && isUserOnline(user) ? (
              <>
                <CareIcon icon={icon} className="text-xl text-green-600" />
                <span
                  className="relative top-2 h-3 w-3 rounded-full bg-primary-500"
                  aria-label="Online"
                />
              </>
            ) : (
              <CareIcon icon={icon} className="text-2xl text-secondary-600" />
            )
          }
        </div>
        <div className="ml-4 flex flex-auto flex-col gap-1">
          <div className="flex justify-between gap-2 text-sm text-secondary-700">
            <span>
              <strong>{formatName(user)}</strong>
            </span>
            <DoctorConnectButtons
              user={user}
              connectOnWhatsApp={connectOnWhatsApp}
            />
          </div>
          {!!user.skills.length && (
            <div className="mt-1 text-sm leading-5 text-secondary-900">
              <div className="flex flex-wrap gap-2">
                {user.skills?.map((skill: SkillObjectModel) => (
                  <span
                    key={skill.id}
                    className="flex items-center gap-2 rounded-full border-secondary-300 bg-secondary-200 px-3 text-xs text-secondary-900"
                  >
                    <p className="py-1.5">{skill.name}</p>
                  </span>
                ))}
              </div>
            </div>
          )}
          <div className="flex justify-between gap-2 text-sm text-secondary-500">
            <div className="flex items-center gap-1">
              <a
                role="button"
                href="#"
                onClick={async (e) => {
                  e.stopPropagation();
                  await navigator.clipboard.writeText(
                    user?.alt_phone_number || "",
                  );
                }}
              >
                <span className="tooltip" id="copy-phoneicon">
                  <span className="tooltip-text tooltip-top">
                    Copy Phone number
                  </span>
                  <CareIcon icon="l-clipboard" className="h-5 w-5" />
                </span>
              </a>
              <span>{user.alt_phone_number}</span>
            </div>
            <div className="text-sm text-secondary-500">
              {user.last_login && <span>{relativeTime(user.last_login)}</span>}
            </div>
          </div>
        </div>
      </a>
    </div>
  );
}

function DoctorConnectButtons(props: {
  user: UserAssignedModel;
  connectOnWhatsApp: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const user = props.user;
  const authUser = useAuthUser();
  return (
    <div className="flex gap-2">
      {user.video_connect_link && (
        <a
          href={user.video_connect_link}
          onClick={(e) => {
            e.stopPropagation();
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
            <span className="tooltip-text tooltip-left">
              Connect on a Video Call
            </span>
            <CareIcon icon="l-video" className="h-5 w-5" />
          </div>
        </a>
      )}
      <a onClick={props.connectOnWhatsApp}>
        <div className="tooltip">
          <span className="tooltip-text tooltip-left">Connect on WhatsApp</span>
          <CareIcon icon="l-whatsapp" id="whatsapp-icon" className="h-5 w-5" />
        </div>
      </a>
      <a
        href={user.alt_phone_number ? `tel:${user.alt_phone_number}` : "#"}
        onClick={(e) => {
          e.stopPropagation();
          triggerGoal("Doctor Connect Click", {
            medium: "Phone Call",
            userId: authUser.id,
            targetUserType: user.user_type,
          });
        }}
      >
        <div className="tooltip">
          <span className="tooltip-text tooltip-left">Connect on Phone</span>
          <CareIcon icon="l-phone-alt" id="phone-icon" className="h-5 w-5" />
        </div>
      </a>
      <PLUGIN_Component __name="DoctorConnectButtons" user={user} />
    </div>
  );
}
