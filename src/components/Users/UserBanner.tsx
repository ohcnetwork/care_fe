import dayjs from "dayjs";
import { t } from "i18next";

import { Avatar } from "@/components/Common/Avatar";
import UserDetails from "@/components/Common/UserDetails";
import UserDetailComponent from "@/components/Common/UserDetailsComponet";
import { UserModel } from "@/components/Users/models";

import { formatDisplayName, formatName } from "@/Utils/utils";

import { UserStatusIndicator } from "./UserListAndCard";

export default function UserBanner({ userData }: { userData: UserModel }) {
  if (!userData) {
    return;
  }

  return (
    <div className="mt-2 flex flex-col justify-between gap-3 sm:flex-row">
      <div className="mb-3 flex w-full flex-col justify-between gap-3 rounded bg-white p-3 shadow-sm transition-all duration-200 ease-in-out sm:flex-row md:p-6">
        <div className="flex flex-row gap-2 self-center">
          <Avatar
            imageUrl={userData?.read_profile_picture_url}
            name={formatDisplayName(userData)}
            className="h-20 w-20 md:mr-2 lg:mr-3 lg:h-16 lg:w-16"
          />
          <div className="flex flex-col self-center">
            <div className="flex flex-row items-center gap-3">
              <h1 className="text-xl font-bold" id="users-name">
                {formatName(userData)}
              </h1>
              <div className="min-width-50 shrink-0 text-sm text-secondary-600">
                <UserStatusIndicator user={userData} addPadding />
              </div>
            </div>

            <span
              id="username"
              className="text-sm font-light leading-relaxed text-secondary-600"
            >
              {userData.username}
            </span>
          </div>
        </div>
        <div className="flex flex-row flex-wrap items-center justify-between gap-x-14">
          {userData.user_type && (
            <UserDetailComponent
              id="role"
              title="Role"
              value={userData.user_type}
            />
          )}
          {userData.district_object && (
            <UserDetailComponent
              id="district"
              title="District"
              value={userData.district_object.name}
            />
          )}
          <UserDetails id="home-facility" title={t("home_facility")}>
            <span className="block font-semibold">
              {userData.home_facility_object?.name || t("no_home_facility")}
            </span>
          </UserDetails>
          {["Doctor", "Nurse"].includes(userData.user_type) && (
            <UserDetails id="qualification" title={t("qualification")}>
              {userData.qualification ? (
                <span className="font-semibold">{userData.qualification}</span>
              ) : (
                <span className="text-secondary-600">{t("unknown")}</span>
              )}
            </UserDetails>
          )}
          {userData.user_type === "Doctor" && (
            <UserDetails id="doctor-experience" title="Experience">
              {userData.doctor_experience_commenced_on ? (
                <span className="font-semibold">
                  {dayjs().diff(
                    userData.doctor_experience_commenced_on,
                    "years",
                    false,
                  )}{" "}
                  years
                </span>
              ) : (
                <span className="text-secondary-600">{t("unknown")}</span>
              )}
            </UserDetails>
          )}
        </div>
      </div>
    </div>
  );
}
