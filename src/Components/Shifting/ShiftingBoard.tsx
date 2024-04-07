import {
  Dispatch,
  SetStateAction,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  classNames,
  formatDateTime,
  formatPatientAge,
} from "../../Utils/utils";
import { downloadShiftRequests } from "../../Redux/actions";
import { useDrag, useDrop } from "react-dnd";

import ButtonV2 from "../Common/components/ButtonV2";
import ConfirmDialog from "../Common/ConfirmDialog";
import { navigate } from "raviger";
import useConfig from "../../Common/hooks/useConfig";

import { useTranslation } from "react-i18next";
import { ExportButton } from "../Common/Export";
import dayjs from "../../Utils/dayjs";
import useAuthUser from "../../Common/hooks/useAuthUser";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import useQuery from "../../Utils/request/useQuery";
import { PaginatedResponse } from "../../Utils/request/types";
import { IShift } from "./models";
import CareIcon from "../../CAREUI/icons/CareIcon";

interface boardProps {
  board: string;
  title?: string;
  filterProp: any;
  formatFilter: any;
  setContainerHeight: Dispatch<SetStateAction<number>>;
  containerHeight: number;
}

const reduceLoading = (action: string, current: any) => {
  switch (action) {
    case "MORE":
      return { ...current, more: true };
    case "BOARD":
      return { ...current, board: true };
    case "COMPLETE":
      return { board: false, more: false };
  }
};

const ShiftCard = ({ shift, filter }: any) => {
  const { wartime_shifting } = useConfig();
  const [modalFor, setModalFor] = useState({
    externalId: undefined,
    loading: false,
  });
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "shift-card",
    item: shift,
    collect: (monitor) => ({ isDragging: !!monitor.isDragging() }),
  }));
  const authUser = useAuthUser();
  const { t } = useTranslation();

  const handleTransferComplete = async (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    await request(routes.completeTransfer, {
      pathParams: { externalId: shift.external_id },
    });
    navigate(
      `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`
    );
  };
  return (
    <div ref={drag} className="mt-2 w-full">
      <div
        className="mx-2 h-full overflow-hidden rounded-lg bg-white shadow"
        style={{
          opacity: isDragging ? 0.2 : 1,
          cursor: isDragging ? "grabbing" : "grab",
        }}
      >
        <div
          className={classNames(
            "flex h-full flex-col justify-between p-4",
            shift.patient_object.disease_status == "POSITIVE" && "bg-red-50"
          )}
        >
          <div>
            <div className="flex justify-between">
              <div className="mb-2 text-xl font-bold capitalize">
                {shift.patient_object.name} -{" "}
                {formatPatientAge(shift.patient_object, true)}
              </div>
              <div>
                {shift.emergency && (
                  <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                    {t("emergency")}
                  </span>
                )}
              </div>
            </div>
            <dl className="grid grid-cols-1 gap-x-1 gap-y-2 sm:grid-cols-1">
              <div className="sm:col-span-1">
                <dt
                  title={t("phone_number")}
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <CareIcon icon="l-mobile-android" className="mr-2 text-xl" />
                  <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                    {shift.patient_object.phone_number || ""}
                  </dd>
                </dt>
              </div>
              <div className="sm:col-span-1">
                <dt
                  title={t("origin_facility")}
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <CareIcon icon="l-plane-departure" className="mr-2 text-xl" />
                  <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                    {(shift.origin_facility_object || {}).name}
                  </dd>
                </dt>
              </div>
              {wartime_shifting && (
                <div className="sm:col-span-1">
                  <dt
                    title={t("shifting_approving_facility")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-user-check" className="mr-2 text-xl" />
                    <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                      {(shift.shifting_approving_facility_object || {}).name}
                    </dd>
                  </dt>
                </div>
              )}
              <div className="sm:col-span-1">
                <dt
                  title={t("assigned_facility")}
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <CareIcon icon="l-plane-arrival" className="mr-2 text-xl" />

                  <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                    {shift.assigned_facility_external ||
                      shift.assigned_facility_object?.name ||
                      t("yet_to_be_decided")}
                  </dd>
                </dt>
              </div>

              <div className="sm:col-span-1">
                <dt
                  title={t("last_modified")}
                  className={
                    "flex items-center text-sm font-medium leading-5 " +
                    (dayjs().subtract(2, "hours").isBefore(shift.modified_date)
                      ? "text-gray-900"
                      : "rounded bg-red-400 p-1 text-white")
                  }
                >
                  <CareIcon icon="l-stopwatch" className="mr-2 text-xl" />
                  <dd className="break-normal text-sm font-bold leading-5">
                    {formatDateTime(shift.modified_date) || "--"}
                  </dd>
                </dt>
              </div>

              <div className="sm:col-span-1">
                <dt
                  title={t("patient_address")}
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <CareIcon icon="l-home" className="mr-2 text-xl" />
                  <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                    {shift.patient_object.address || "--"}
                  </dd>
                </dt>
              </div>

              {shift.assigned_to_object && (
                <div className="sm:col-span-1">
                  <dt
                    title={t("assigned_to")}
                    className="flex items-center text-sm font-medium leading-5 text-gray-500"
                  >
                    <CareIcon icon="l-user" className="mr-2 text-xl" />
                    <dd className="break-normal text-sm font-bold leading-5 text-gray-900">
                      {shift.assigned_to_object.first_name}{" "}
                      {shift.assigned_to_object.last_name} -{" "}
                      {shift.assigned_to_object.user_type}
                    </dd>
                  </dt>
                </div>
              )}

              <div className="sm:col-span-1">
                <dt
                  title={t("patient_state")}
                  className="flex items-center text-sm font-medium leading-5 text-gray-500"
                >
                  <CareIcon icon="l-map-marker" className="mr-2 text-xl" />
                  <dd className="text-sm font-bold leading-5 text-gray-900">
                    {shift.patient_object.state_object.name || "--"}
                  </dd>
                </dt>
              </div>
            </dl>
          </div>

          <div className="mt-2 flex">
            <button
              onClick={(_) => navigate(`/shifting/${shift.external_id}`)}
              className="btn btn-default mr-2 w-full bg-white"
            >
              <CareIcon icon="l-eye" className="mr-2 text-xl" />{" "}
              {t("all_details")}
            </button>
          </div>
          {filter === "COMPLETED" && shift.assigned_facility && (
            <div className="mt-2">
              <ButtonV2
                variant="secondary"
                className="w-full sm:whitespace-normal"
                disabled={
                  !shift.patient_object.allow_transfer ||
                  !(
                    ["DistrictAdmin", "StateAdmin"].includes(
                      authUser.user_type
                    ) ||
                    authUser.home_facility_object?.id ===
                      shift.assigned_facility
                  )
                }
                onClick={() => setModalFor(shift.external_id)}
              >
                {t("transfer_to_receiving_facility")}
              </ButtonV2>

              <ConfirmDialog
                title={t("confirm_transfer_complete")}
                description={t("mark_this_transfer_as_complete_question")}
                show={modalFor === shift.external_id}
                onClose={() =>
                  setModalFor({ externalId: undefined, loading: false })
                }
                action={t("confirm")}
                onConfirm={() => handleTransferComplete(shift)}
              >
                <p className="mt-2 text-sm text-yellow-600">
                  {t("redirected_to_create_consultation")}
                </p>
              </ConfirmDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function ShiftingBoard({
  board,
  title,
  filterProp,
  formatFilter,
  setContainerHeight,
  containerHeight,
}: boardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [offset, setOffSet] = useState(0);
  const [isLoading, setIsLoading] = useState({ board: "BOARD", more: false });
  const [{ isOver }, drop] = useDrop(() => ({
    accept: "shift-card",
    drop: (item: any) => {
      if (item.status !== board) {
        navigate(`/shifting/${item.id}/update?status=${board}`);
      }
    },
    collect: (monitor) => ({ isOver: !!monitor.isOver() }),
  }));
  const [data, setData] = useState<PaginatedResponse<IShift>>();

  useQuery(routes.listShiftRequests, {
    query: formatFilter({
      ...filterProp,
      status: board,
    }),
    onResponse: ({ res, data: listShiftData }) => {
      if (res?.ok && listShiftData) {
        setData(listShiftData);
      }
      setIsLoading((loading) => reduceLoading("COMPLETE", loading));
    },
  });

  useEffect(() => {
    setIsLoading((loading) => reduceLoading("BOARD", loading));
  }, [
    filterProp.facility,
    filterProp.origin_facility,
    filterProp.shifting_approving_facility,
    filterProp.assigned_facility,
    filterProp.emergency,
    filterProp.is_up_shift,
    filterProp.patient_name,
    filterProp.created_date_before,
    filterProp.created_date_after,
    filterProp.modified_date_before,
    filterProp.modified_date_after,
    filterProp.patient_phone_number,
    filterProp.ordering,
    filterProp.is_kasp,
    filterProp.assigned_to,
    filterProp.disease_status,
    filterProp.is_antenatal,
    filterProp.breathlessness_level,
  ]);

  const handlePagination = async () => {
    setIsLoading((loading) => reduceLoading("MORE", loading));
    setOffSet(offset + 14);
    const { res, data: newPageData } = await request(routes.listShiftRequests, {
      query: formatFilter({
        ...filterProp,
        status: board,
        offset: offset,
      }),
    });
    if (res?.ok && newPageData) {
      setData((prev) =>
        prev
          ? { ...prev, results: [...prev.results, ...newPageData.results] }
          : newPageData
      );
    }
    setIsLoading((loading) => reduceLoading("COMPLETE", loading));
  };
  const { t } = useTranslation();

  const patientFilter = (filter: string) => {
    return data?.results
      .filter(({ status }) => status === filter)
      .map((shift: any) => (
        <ShiftCard key={`shift_${shift.id}`} shift={shift} filter={filter} />
      ));
  };

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (container) {
      const { height } = container.getBoundingClientRect();
      containerHeight < height && setContainerHeight(height);
    }
  }, [containerRef.current, data?.results.length]);

  return (
    <div
      ref={drop}
      className={classNames(
        "mr-2 h-full w-full flex-shrink-0 rounded-md bg-gray-200 pb-4 md:w-1/2 lg:w-1/3 xl:w-1/4",
        isOver && "cursor-move"
      )}
      style={{ minHeight: `${containerHeight + 100}px` }}
    >
      <div className="sticky top-0 z-10 rounded bg-gray-200 pt-2">
        <div className="mx-2 flex items-center justify-between rounded bg-white p-4 shadow">
          <h3 className="flex h-8 items-center text-xs">
            {title || board}{" "}
            <ExportButton
              action={() =>
                downloadShiftRequests({
                  ...formatFilter({ ...filterProp, status: board }),
                  csv: 1,
                })
              }
              filenamePrefix={`shift_requests_${board}`}
            />
          </h3>
          <span className="ml-2 rounded-lg bg-primary-500 px-2 text-white">
            {data?.count || "0"}
          </span>
        </div>
      </div>
      <div ref={containerRef} className="mt-2 flex flex-col pb-2 text-sm">
        {isLoading.board ? (
          <div className="m-1">
            <div className="mx-auto w-full max-w-sm rounded-md border border-gray-300 bg-white p-4 shadow">
              <div className="flex animate-pulse space-x-4 ">
                <div className="flex-1 space-y-4 py-1">
                  <div className="h-4 w-3/4 rounded bg-gray-400"></div>
                  <div className="space-y-2">
                    <div className="h-4 rounded bg-gray-400"></div>
                    <div className="h-4 w-5/6 rounded bg-gray-400"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : data?.count ?? 0 > 0 ? (
          patientFilter(board)
        ) : (
          <p className="mx-auto p-4">{t("no_patients_to_show")}</p>
        )}
        {!isLoading.board &&
          (data?.count ?? 0) < (data?.results.length || 0) &&
          (isLoading.more ? (
            <div className="mx-auto my-4 rounded-md bg-gray-100 p-2 px-4 hover:bg-white">
              {t("loading")}
            </div>
          ) : (
            <button
              onClick={(_) => handlePagination()}
              className="mx-auto my-4 rounded-md bg-gray-100 p-2 px-4 hover:bg-white"
            >
              More...
            </button>
          ))}
      </div>
    </div>
  );
}
