import careConfig from "@careConfig";
import { navigate, usePath } from "raviger";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { cn } from "@/lib/utils";

import CareIcon from "@/CAREUI/icons/CareIcon";

import useAuthUser from "@/hooks/useAuthUser";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";
import useTanStackQueryInstead from "@/Utils/request/useQuery";
import { formatDateTime } from "@/Utils/utils";

import ConfirmDialog from "../Common/ConfirmDialog";
import Loading from "../Common/Loading";
import { ShiftingModel } from "../Facility/models";
import { Badge } from "../ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { printData } from "./ShiftDetails";
import { ShiftDetailsUpdate } from "./ShiftDetailsUpdate";

export default function ShiftingTable(props: {
  data?: ShiftingModel[];
  loading?: boolean;
  hidePatient?: boolean;
}) {
  const { data, loading, hidePatient } = props;

  const { t } = useTranslation();
  const authUser = useAuthUser();
  const currentPath = usePath();
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isSlideOverOpen, setIsSlideOverOpen] = useState(false);
  const [selectedShiftId, setselectedShiftId] = useState<string>("");

  const [modalFor, setModalFor] = useState<{
    externalId: string | undefined;
    loading: boolean;
  }>({
    externalId: undefined,
    loading: false,
  });

  const { data: shiftData, loading: shiftDetailsLoading } =
    useTanStackQueryInstead(routes.getShiftDetails, {
      pathParams: { id: selectedShiftId },
      prefetch: !!selectedShiftId,
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

  if (loading || shiftDetailsLoading) {
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
      {isPrintMode ? (
        <div>{printData(shiftData)}</div>
      ) : (
        <div>
          <div
            className={cn(
              " mt-5 grid w-full gap-2 border-b-2 rounded-lg border border-gray-200  p-4 text-sm font-medium sm:grid-cols-1 md:grid-cols-1 mb-2",
              hidePatient ? "lg:grid-cols-4" : "lg:grid-cols-5",
            )}
          >
            {!hidePatient && (
              <div className="col-span-1 px-2 uppercase sm:text-center md:text-center lg:block lg:text-left">
                {t("patients")}
              </div>
            )}

            <div className="col-span-1  pl-4 hidden text-left uppercase sm:hidden md:hidden lg:block">
              {t("consent__status")}
            </div>
            <div className="col-span-1 px-2 hidden text-left uppercase sm:hidden md:hidden lg:block">
              {t("From")}
            </div>
            <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
              {t("To")}
            </div>
            <div className="col-span-1 hidden text-left uppercase sm:hidden md:hidden lg:block">
              {t("Date and Time")}
            </div>
          </div>
          <div>
            {data?.map((shift: ShiftingModel) => (
              <div key={`shift_${shift.id}`} className="w-full  ">
                <div
                  className={cn(
                    "border-3 grid w-full my-2 rounded-lg border border-gray-200 gap-1 overflow-hidden bg-white px-4 py-6 shadow sm:grid-cols-1 md:grid-cols-1",
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

                  <div className="col-span-1 flex mt-1 flex-col px-3 text-left">
                    <div className="3xl:flex-row  flex gap-2 sm:flex-row md:flex-row lg:flex-col xl:flex-row 2xl:flex-row">
                      <dt title={t("shifting_status")}>
                        {shift.status === "COMPLETED" ? (
                          <Badge
                            variant="custom"
                            className="bg-blue-100 text-blue-800"
                          >
                            <CareIcon icon="l-truck" className="mr-2" />
                            <dd>{shift.status}</dd>
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <CareIcon icon="l-truck" className="mr-2" />
                            <dd>{shift.status}</dd>
                          </Badge>
                        )}
                      </dt>

                      <div>
                        {shift.emergency && (
                          <Badge variant="danger">{t("emergency")}</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-1 mt-2 text-left">
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
                  </div>

                  <div className="col-span-1 mt-2 flex flex-col text-left">
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
                  <div className="col-span-1 mt-1 flex justify-between text-left">
                    <dt
                      title={t("modified_date")}
                      className="flex items-center text-left text-sm font-medium leading-5 text-secondary-500"
                    >
                      <CareIcon icon="l-stopwatch" className="mr-1" />
                      <dd className="text-xs font-medium leading-5">
                        {formatDateTime(shift.modified_date) || "--"}
                      </dd>
                    </dt>
                    <div className="col-span-1 mr-2 mb-1 flex flex-col text-left ">
                      <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                          <h1 className="hover:cursor-pointer font-bold text-lg text-green-700">
                            . . .
                          </h1>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-full font-medium "
                        >
                          <DropdownMenuItem
                            className=" hover:font-bold cursor-pointer"
                            onClick={() =>
                              currentPath?.includes("/shifting/list") ||
                              currentPath?.includes("/shifting/board")
                                ? navigate(`/shifting/${shift.external_id}`)
                                : navigate(`shifting/${shift.external_id}`)
                            }
                          >
                            {t("View details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className=" hover:font-bold cursor-pointer"
                            disabled={
                              shift?.status === "COMPLETED" ||
                              shift?.status === "CANCELLED"
                            }
                            onClick={() => setIsSlideOverOpen(true)}
                            // onClick={() =>
                            //   navigate(`/shifting/${shift?.external_id}/update`)
                            // }
                          >
                            {t("update_status_details")}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className=" hover:font-bold cursor-pointer"
                            onClick={() => {
                              setIsPrintMode(true);
                              setselectedShiftId(shift.id);
                            }}
                          >
                            {t("referral_letter")}
                          </DropdownMenuItem>
                          {shift.status === "COMPLETED" &&
                            shift.assigned_facility && (
                              <DropdownMenuItem
                                className=" hover:font-bold cursor-pointer"
                                onClick={() =>
                                  setModalFor({
                                    externalId: shift.external_id,
                                    loading: false,
                                  })
                                }
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
                              >
                                {t("transfer_to_receiving_facility")}
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ShiftDetailsUpdate
                        id={shift?.external_id}
                        open={isSlideOverOpen}
                        setOpen={setIsSlideOverOpen}
                      />
                      <ConfirmDialog
                        title={t("confirm_transfer_complete")}
                        description={t("mark_transfer_complete_confirmation")}
                        action="Confirm"
                        show={modalFor.externalId === shift.external_id}
                        onClose={() =>
                          setModalFor({ externalId: undefined, loading: false })
                        }
                        onConfirm={() => handleTransferComplete(shift)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
