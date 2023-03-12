import moment from "moment";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import SlideOver from "../../CAREUI/interactive/SlideOver";
import { getFacilityUsers } from "../../Redux/actions";
import { UserAssignedModel } from "../Users/models";
import { SkillObjectModel } from "../Users/models";
import CareIcon from "../../CAREUI/icons/CareIcon";
import { Link } from "raviger";

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
        const res = await dispatchAction(getFacilityUsers(facilityId));
        if (res && res.data) {
          setDoctors(
            res.data.results
              .filter((user: any) => user.alt_phone_number)
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
      <p className="text-gray-600 text-sm -mt-3 pb-4">
        Select a doctor to connect via video
      </p>
      {[
        {
          title: "Doctors",
          user_type: "Doctor",
          home: true,
        },
        {
          title: "Staff",
          user_type: "Staff",
          home: true,
        },
        {
          title: "TeleICU Hub",
          user_type: "Doctor",
          home: false,
        },
      ].map((type, i) => (
        <div key={i} className="mb-4">
          <div>
            <span className="text-lg font-semibold">{type.title}</span>
          </div>

          <ul
            className="max-h-96 scroll-py-3 overflow-y-auto list-none"
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
                return (
                  <UserListItem
                    key={doctor.id}
                    user={doctor}
                    facilityId={facilityId}
                  />
                );
              })}
          </ul>
        </div>
      ))}
    </SlideOver>
  );
}

function UserListItem(props: { user: UserAssignedModel; facilityId: string }) {
  const user = props.user;
  const icon =
    user.user_type === "Doctor" ? "fa-user-doctor " : " fa-user-nurse";

  return (
    <li>
      <li
        key={user.id}
        className={
          "mt-2 group cursor-default select-none rounded-xl p-3 " +
          (user.alt_phone_number
            ? "cursor-pointer border border-gray-400 transition hover:border-green-500 hover:bg-green-50"
            : "cursor-not-allowed pointer-events-none bg-gray-400 ")
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
          <div className="flex h-10 w-10 flex-none items-center justify-center">
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
              <div className="flex gap-2">
                <Link
                  href={`/facility/${props.facilityId}/live_connect/${user.id}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-left">
                      Connect on Care
                    </span>
                    <CareIcon className="care-l-video w-5 h-5" />
                  </div>
                </Link>
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
                >
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-left">
                      Connect on WhatsApp
                    </span>
                    <CareIcon className="care-l-whatsapp w-5 h-5" />
                  </div>
                </a>
                <a
                  href={
                    user.alt_phone_number ? `tel:${user.alt_phone_number}` : "#"
                  }
                >
                  <div className="tooltip">
                    <span className="tooltip-text tooltip-left">
                      Connect on Phone
                    </span>
                    <CareIcon className="care-l-phone-alt w-5 h-5" />
                  </div>
                </a>
              </div>
            </p>
            {!!user.skills.length && (
              <div className="mt-1 text-sm leading-5 text-gray-900">
                <div className="flex flex-wrap gap-2">
                  {user.skills?.map((skill: SkillObjectModel) => (
                    <span className="flex gap-2 items-center bg-gray-200 border-gray-300 text-gray-900 rounded-full text-xs px-3">
                      <p className="py-1.5">{skill.name}</p>
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500 flex gap-2 divide-gray-800">
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
                  <CareIcon className="care-l-clipboard w-5 h-5" />
                </div>
              </a>
              <span>{user.alt_phone_number}</span>
              {user.last_login && (
                <span>{moment(user.last_login).fromNow()}</span>
              )}
            </p>
          </div>
        </a>
      </li>
    </li>
  );
}
