import careConfig from "@careConfig";
import { navigate } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import { formatDateTime } from "@/Utils/utils";

import ButtonV2 from "../Common/ButtonV2";
import ConfirmDialog from "../Common/ConfirmDialog";
import Loading from "../Common/Loading";
import { ShiftingModel } from "../Facility/models";

export default function ShiftingTable(props: {
  data?: ShiftingModel[];
  loading?: boolean;
  hidePatient?: boolean;
}) {
  const { data, loading, hidePatient } = props;

  const { t } = useTranslation();
  const authUser = useAuthUser();
  const [modalFor, setModalFor] = useState<{
    externalId: string | undefined;
    loading: boolean;
  }>({
    externalId: undefined,
    loading: false,
  });

  const handleTransferComplete = async (shift: ShiftingModel) => {
    setModalFor({ ...modalFor, loading: true });
    try {
      await request(routes.completeTransfer, {
        pathParams: { externalId: shift.external_id },
      });
      navigate(
        `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`,
      );
    } catch (error) {
      setModalFor({ externalId: undefined, loading: false });
    }
  };

  if (loading) {
    return <Loading />;
  }
  if (data && !data.length) {
    return (
      <div className="mt-64 flex flex-1 justify-center text-secondary-600">
        {t("no_results_found")}
      </div>
    );
  }

  return (
    <div>
      <div
        className={cn(
          " mt-5 grid w-full gap-2 border-b-2 border-gray-100 p-4 text-sm font-medium sm:grid-cols-1 md:grid-cols-1",
          hidePatient ? "lg:grid-cols-4" : "lg:grid-cols-5",
        )}
      >
        {!hidePatient && (
          <div className="col-span-1 uppercase sm:text-center md:text-center lg:block lg:text-left">
            {t("patients")}
          </div>
        )}
        <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
          {t("contact_info")}
        </div>
        <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
          {t("consent__status")}
        </div>
        <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
          {t("facilities")}
        </div>
        <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
          {t("LOG_UPDATE_FIELD_LABEL__action")}
        </div>
      </div>
      <div>
        {data?.map((shift: ShiftingModel) => (
          <div
            key={`shift_${shift.id}`}
            className="w-full border-b-2 border-gray-100"
          >
            <div
              className={cn(
                "border-3 grid w-full gap-1 overflow-hidden bg-white p-4 shadow sm:grid-cols-1 md:grid-cols-1",
                hidePatient ? "lg:grid-cols-4" : "lg:grid-cols-5",
              )}
            >
              {!hidePatient && (
                <div className="col-span-1 px-2 text-left">
                  <div className="text-sm font-bold capitalize">
                    {shift.patient_object.name}
                  </div>
                  <div className="text-xs font-semibold capitalize">
                    {shift.patient_object.age}
                  </div>
                </div>
              )}

              <div className="col-span-1 flex flex-col px-2 text-left">
                <div className="phone number">
                  <dt
                    title={t("phone_number")}
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-mobile-android" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {shift.patient_object.phone_number || ""}
                    </dd>
                  </dt>
                </div>
                <div className="address mt-1">
                  <dt
                    title={t("patient_address")}
                    className="flex items-center text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-home" className="mr-2" />
                    <dd className="font-xs leading-5 text-secondary-900">
                      {shift.patient_object.address || "--"}
                    </dd>
                  </dt>
                </div>
              </div>

              <div className="col-span-1 flex flex-col px-3 text-left">
                <div className="3xl:flex-row mb-2 flex gap-2 sm:flex-row md:flex-row lg:flex-col xl:flex-row 2xl:flex-row">
                  <dt
                    title={t("shifting_status")}
                    className={`mt-1 flex h-5 shrink-0 items-center rounded-full px-2 py-0.5 text-xs font-medium leading-4 ${
                      shift.status === "COMPLETED"
                        ? "bg-sky-200"
                        : "bg-yellow-200 text-yellow-500"
                    }`}
                  >
                    <CareIcon icon="l-truck" className="mr-2" />
                    <dd className="text-sky-600">{shift.status}</dd>
                  </dt>

                  <div>
                    {shift.emergency && (
                      <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                        {t("emergency")}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center">
                  <dt
                    title={t("last_modified")}
                    className={
                      "flex items-center text-sm font-medium leading-5"
                    }
                  >
                    <CareIcon icon="l-stopwatch" className="mr-1" />
                    <dd className="text-xs font-medium leading-5">
                      {formatDateTime(shift.modified_date) || "--"}
                    </dd>
                  </dt>
                </div>
              </div>

              <div className="col-span-1 text-left">
                <dt
                  title={t("origin_facility")}
                  className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
                >
                  <CareIcon icon="l-plane-departure" className="mr-2" />
                  <dd className="text-sm font-bold leading-5 text-secondary-900">
                    {shift.origin_facility_object?.name}
                  </dd>
                </dt>

                {careConfig.wartimeShifting && (
                  <dt
                    title={t("shifting_approving_facility")}
                    className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
                  >
                    <CareIcon icon="l-user-check" className="mr-2" />
                    <dd className="text-sm font-bold leading-5 text-secondary-900">
                      {shift.shifting_approving_facility_object?.name}
                    </dd>
                  </dt>
                )}

                <dt
                  title={t("assigned_facility")}
                  className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
                >
                  <CareIcon icon="l-plane-arrival" className="mr-2" />
                  <dd className="text-sm font-bold leading-5 text-secondary-900">
                    {shift.assigned_facility_external ||
                      shift.assigned_facility_object?.name ||
                      t("yet_to_be_decided")}
                  </dd>
                </dt>
              </div>
              <div className="col-span-1 mt-2 flex flex-col text-left">
                <ButtonV2
                  onClick={(_) => navigate(`/shifting/${shift.external_id}`)}
                  variant="secondary"
                  border
                  className="w-full"
                >
                  <CareIcon icon="l-eye" className="mr-2" /> {t("all_details")}
                </ButtonV2>
                {shift.status === "COMPLETED" && shift.assigned_facility && (
                  <div className="mt-2">
                    <ButtonV2
                      className="w-full"
                      disabled={
                        !shift.patient_object.allow_transfer ||
                        !(
                          ["DistrictAdmin", "StateAdmin"].includes(
                            authUser.user_type,
                          ) ||
                          authUser.home_facility_object?.id ===
                            shift.assigned_facility
                        )
                      }
                      onClick={() =>
                        setModalFor({
                          externalId: shift.external_id,
                          loading: false,
                        })
                      }
                    >
                      {t("transfer_to_receiving_facility")}
                    </ButtonV2>
                    <ConfirmDialog
                      title={t("confirm_transfer_complete")}
                      description={t("mark_transfer_complete_confirmation")}
                      action="Confirm"
                      show={modalFor.externalId === shift.external_id} // Check the externalId here
                      onClose={() =>
                        setModalFor({ externalId: undefined, loading: false })
                      }
                      onConfirm={() => handleTransferComplete(shift)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
