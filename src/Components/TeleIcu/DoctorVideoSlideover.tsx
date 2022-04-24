import moment from "moment";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getFacilityUsers } from "../../Redux/actions";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { UserModel } from "../Users/models";

export default function DoctorVideoSlideover(props: {
  show: boolean;
  facilityId: string;
  setShow: (show: boolean) => void;
}) {
  const { show, facilityId, setShow } = props;
  const [doctors, setDoctors] = useState<UserModel[]>([]);

  const dispatchAction: any = useDispatch();
  useEffect(() => {
    const fetchUsers = async () => {
      if (facilityId) {
        const res = await dispatchAction(getFacilityUsers(facilityId));
        if (res && res.data) {
          setDoctors(res.data);
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
        <ul
          className="max-h-96 scroll-py-3 overflow-y-auto p-3 list-none"
          id="options"
          role="listbox"
        >
          {doctors
            .filter((user) => user.alt_phone_number)
            .sort((a, b) => {
              return Number(a.last_login) - Number(b.last_login);
            })
            .map((doctor) => {
              const icon =
                doctor.user_type === "Doctor"
                  ? "fa-user-doctor "
                  : " fa-user-nurse";
              return (
                <li
                  key={doctor.id}
                  className={
                    "mt-2 group cursor-default select-none rounded-xl p-3 " +
                    (doctor.alt_phone_number
                      ? "cursor-pointer bg-green-100 hover:bg-green-200"
                      : "cursor-not-allowed pointer-events-none bg-gray-400 ")
                  }
                  id="option-1"
                  role="option"
                  tabIndex={-1}
                >
                  <a
                    href={
                      doctor.alt_phone_number
                        ? `https://api.whatsapp.com/send/?phone=${doctor.alt_phone_number}`
                        : "#"
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex"
                  >
                    <div className="flex h-10 w-10 flex-none items-center justify-center">
                      {
                        // Show online icon based on last_login
                        doctor.last_login &&
                        Number(new Date()) -
                          Number(new Date(doctor.last_login)) <
                          60000 ? (
                          <i
                            className={`fa-solid text-xl text-green-600 ${icon}`}
                          ></i>
                        ) : (
                          <i
                            className={`fa-solid text-2xl text-gray-600 ${icon}`}
                          ></i>
                        )
                      }
                    </div>
                    <div className="ml-4 flex-auto">
                      <p className="text-sm font-medium text-gray-700">
                        {doctor.first_name} {doctor.last_name} -{" "}
                        {doctor.user_type}
                      </p>
                      <p className="text-sm text-gray-500 flex gap-2 divide-gray-800">
                        <span>{doctor.alt_phone_number}</span>
                        <span>{moment(doctor.last_login).fromNow()}</span>
                      </p>
                    </div>
                  </a>
                </li>
              );
            })}
        </ul>
      </div>
    </SlideOver>
  );
}
