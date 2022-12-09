import moment from "moment";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getFacilityUsers } from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { UserAssignedModel } from "../Users/models";

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
    <SlideOver show={show} setShow={setShow}>
      <div className="bg-white min-h-screen p-4">
        {/* Title and close button */}
        <div className="flex justify-between items-center pb-4">
          <div>
            <h2 className="text-2xl font-bold">Doctor Connect</h2>
            <p className="text-gray-600 text-sm">
              Select a doctor to connect via video
            </p>
          </div>
          <button
            className="text-gray-600 hover:text-gray-800 border border-gray-400 rounded-xl py-2 px-4"
            onClick={() => setShow(false)}
          >
            {/* Times Icon */}
            <span>
              <i className="fas fa-times mr-2"></i>
              Close
            </span>
          </button>
        </div>
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
                  return <UserListItem key={doctor.id} user={doctor} />;
                })}
            </ul>
          </div>
        ))}
      </div>
    </SlideOver>
  );
}

function UserListItem(props: { user: UserAssignedModel }) {
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
            <p className="text-sm font-medium text-gray-700">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-gray-500 flex gap-2 divide-gray-800">
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
