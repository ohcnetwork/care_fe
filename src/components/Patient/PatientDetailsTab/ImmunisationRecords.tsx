import { navigate } from "raviger";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";

import { UserModel } from "@/components/Users/models";

import useAuthUser from "@/hooks/useAuthUser";

import { ADMIN_USER_TYPES } from "@/common/constants";

import { formatDateTime } from "@/Utils/utils";

import { PatientProps } from ".";
import * as Notification from "../../../Utils/Notifications";
import { PatientModel } from "../models";

export const ImmunisationRecords = (props: PatientProps) => {
  const { patientData, facilityId, id } = props;

  const authUser = useAuthUser();
  const { t } = useTranslation();

  const handleEditClick = (sectionId: string) => {
    navigate(
      `/facility/${facilityId}/patient/${id}/update?section=${sectionId}`,
    );
  };

  const canEditPatient = (authUser: UserModel, patientData: PatientModel) => {
    return (
      ADMIN_USER_TYPES.includes(
        authUser.user_type as (typeof ADMIN_USER_TYPES)[number],
      ) || authUser.home_facility_object?.id === patientData.facility
    );
  };

  return (
    <div className="mt-4 px-4 md:px-0">
      <div className="w-full rounded-md bg-white p-4 shadow-md">
        <hr className="mb-1 mr-5 h-1 w-5 border-0 bg-blue-500" />
        <div>
          <div className="flex flex-row gap-x-4">
            <h1 className="text-xl">{t("covid_details")}</h1>
            <button
              className="hidden rounded border border-secondary-400 bg-white px-1 py-1 text-sm font-semibold text-green-800 hover:bg-secondary-200 group-hover:flex"
              disabled={!patientData.is_active}
              onClick={() => {
                if (!canEditPatient(authUser, patientData)) {
                  Notification.Error({
                    msg: t("permission_denied"),
                  });
                } else {
                  handleEditClick("covid-details");
                }
              }}
            >
              <CareIcon icon="l-edit-alt" className="text-md mr-1 mt-1" />
              {t("edit")}
            </button>
          </div>

          <div className="mb-8 mt-2 grid grid-cols-1 gap-x-4 gap-y-2 md:grid-cols-2 md:gap-y-8 lg:grid-cols-2">
            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("number_of_covid_vaccine_doses")}
              </div>
              <div className="mt-1 text-sm font-medium leading-5">
                {patientData.is_vaccinated && patientData.number_of_doses
                  ? patientData.number_of_doses
                  : "-"}
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("vaccine_name")}
              </div>
              <div className="mt-1 text-sm font-medium leading-5">
                {patientData.is_vaccinated && patientData.vaccine_name
                  ? patientData.vaccine_name
                  : "-"}
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("last_vaccinated_on")}
              </div>
              <div className="mt-1 text-sm font-medium leading-5">
                {patientData.is_vaccinated && patientData.last_vaccinated_date
                  ? formatDateTime(patientData.last_vaccinated_date)
                  : "-"}
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("countries_travelled")}
              </div>
              <div className="mt-1 text-sm font-medium leading-5">
                {patientData.countries_travelled &&
                patientData.countries_travelled.length > 0
                  ? patientData.countries_travelled.join(", ")
                  : "-"}
              </div>
            </div>

            <div className="sm:col-span-1">
              <div className="text-sm font-semibold leading-5 text-zinc-400">
                {t("date_of_return")}
              </div>
              <div className="mt-1 text-sm font-medium leading-5">
                {patientData.date_of_return
                  ? formatDateTime(patientData.date_of_return)
                  : "-"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
