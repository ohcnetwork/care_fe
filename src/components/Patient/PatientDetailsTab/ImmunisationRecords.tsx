import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import Chip from "@/CAREUI/display/Chip";
import CareIcon from "@/CAREUI/icons/CareIcon";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import SearchInput from "@/components/Form/SearchInput";
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

  const [searchTerm, setSearchTerm] = useState("");
  const vaccineStatuses = ["Completed", "In-Progress", "Not-Done"];

  const handleSearchChange = ({ value }: { value: string }) => {
    setSearchTerm(value.toLowerCase()); // Make it case-insensitive
  };
  const filteredData =
    !searchTerm ||
    (patientData.vaccine_name &&
      patientData.vaccine_name.toLowerCase().includes(searchTerm));

  return (
    <section className="mt-6">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          {t("immunisation-records")}
        </h2>
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
        <SearchInput
          className="w-72 sm:w-108 mb-4 sm:mb-0"
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder="Search by Vaccine Name"
          name="vaccineNameSearch"
        />
        <div className="flex sm:ml-4 sm:space-x-4 w-full sm:w-auto mb-4 sm:mb-0">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center w-full sm:w-auto"
              >
                <CareIcon icon="l-filter" className="mr-2" />
                {t("filter")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-full font-medium">
              {vaccineStatuses.map((status) => (
                <DropdownMenuItem
                  key={status}
                  className="hover:font-bold cursor-pointer"
                >
                  {status}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            variant="outline"
            disabled={!patientData.is_active}
            onClick={() => {
              if (!canEditPatient(authUser, patientData)) {
                Notification.Error({
                  msg: t("permission_denied"),
                });
              } else {
                handleEditClick("immunisation");
              }
            }}
            className="w-full sm:w-auto"
          >
            <CareIcon icon="l-edit-alt" className="text-md pr-1" />
            {t("edit")}
          </Button>
        </div>
      </div>
      {/*Table for immunisation details*/}
      <div className="overflow-x-auto shadow-sm rounded-lg mt-4">
        <table className="min-w-full table-auto border-separate border-spacing-0 bg-white">
          <thead className="bg-gray-200">
            <tr>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                Immunisation Type
              </th>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                Covin ID
              </th>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                {t("vaccine_name")}
              </th>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                {t("status")}
              </th>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                {t("last_vaccinated_on")}
              </th>
              <th className="border-b-2 border-gray-200 px-4 py-2 text-left text-sm font-medium text-secondary-600">
                Series Progress
              </th>
            </tr>
          </thead>

          <tbody>
            {patientData.is_vaccinated && filteredData ? (
              <tr>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-gray-800 font-semibold">
                  COVID-19
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-secondary-800">
                  {patientData.is_vaccinated && patientData.covin_id
                    ? patientData.covin_id
                    : "-"}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-secondary-800">
                  {patientData.is_vaccinated && patientData.vaccine_name
                    ? patientData.vaccine_name
                    : "-"}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-secondary-800">
                  <Chip
                    text="Completed"
                    className="text-green rounded-full text-sm font-semibold"
                  />
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-secondary-800">
                  {patientData.is_vaccinated && patientData.last_vaccinated_date
                    ? formatDateTime(patientData.last_vaccinated_date)
                    : "-"}
                </td>
                <td className="border-b border-gray-200 px-4 py-3 text-sm text-secondary-800">
                  {patientData.is_vaccinated && patientData.number_of_doses
                    ? patientData.number_of_doses + "/3"
                    : "-"}
                </td>
              </tr>
            ) : (
              <tr>
                <td
                  className="border-b border-gray-200 px-4 py-3 text-center text-secondary-800 text-sm font-semibold"
                  colSpan={6}
                >
                  No Immunisation Records Available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
