import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "../../Common/constants";

import BadgesList from "./BadgesList";
import { ExportButton } from "../Common/Export";
import ListFilter from "./ListFilter";
import SearchInput from "../Form/SearchInput";
import { formatFilter } from "./Commons";

import { Link, navigate } from "raviger";
import useFilters from "../../Common/hooks/useFilters";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import ButtonV2 from "../Common/components/ButtonV2";
import { AdvancedFilterButton } from "../../CAREUI/interactive/FiltersSlideover";
import CareIcon from "../../CAREUI/icons/CareIcon";
import Tabs from "../Common/components/Tabs";
import careConfig from "@careConfig";
import KanbanBoard from "../Kanban/Board";
import { classNames, formatDateTime, formatName } from "../../Utils/utils";
import dayjs from "dayjs";
import ConfirmDialog from "../Common/ConfirmDialog";
import { ShiftingModel } from "../Facility/models";
import useAuthUser from "../../Common/hooks/useAuthUser";
import request from "../../Utils/request/request";
import routes from "../../Redux/api";
import PageTitle from "@/Components/Common/PageTitle";

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, advancedFilter } = useFilters({
    limit: -1,
    cacheBlacklist: ["patient_name"],
  });

  const [modalFor, setModalFor] = useState<{
    externalId?: string;
    loading: boolean;
  }>({
    externalId: undefined,
    loading: false,
  });

  const authUser = useAuthUser();

  const handleTransferComplete = async (shift: any) => {
    setModalFor({ ...modalFor, loading: true });
    await request(routes.completeTransfer, {
      pathParams: { externalId: shift.external_id },
    });
    navigate(
      `/facility/${shift.assigned_facility}/patient/${shift.patient}/consultation`,
    );
  };

  const shiftStatusOptions = careConfig.wartimeShifting
    ? SHIFTING_CHOICES_WARTIME
    : SHIFTING_CHOICES_PEACETIME;

  const COMPLETED = careConfig.wartimeShifting
    ? [
        "COMPLETED",
        "REJECTED",
        "CANCELLED",
        "DESTINATION REJECTED",
        "PATIENT EXPIRED",
      ]
    : ["CANCELLED", "PATIENT EXPIRED"];

  const completedBoards = shiftStatusOptions.filter((option) =>
    COMPLETED.includes(option.text),
  );
  const activeBoards = shiftStatusOptions.filter(
    (option) => !COMPLETED.includes(option.text),
  );

  const [boardFilter, setBoardFilter] = useState(activeBoards);
  const { t } = useTranslation();

  return (
    <div className="flex-col px-2 pb-2">
      <div className="flex w-full flex-col items-center justify-between lg:flex-row">
        <div className="w-1/3 lg:w-1/4">
          <PageTitle
            title={t("shifting")}
            className="mx-3 md:mx-5"
            hideBack
            componentRight={
              <ExportButton
                action={async () => {
                  const { data } = await request(routes.downloadShiftRequests, {
                    query: { ...formatFilter(qParams), csv: true },
                  });
                  return data ?? null;
                }}
                filenamePrefix="shift_requests"
              />
            }
            breadcrumbs={false}
          />
        </div>
        <div className="flex w-full flex-col items-center justify-between gap-2 pt-2 xl:flex-row">
          <SearchInput
            name="patient_name"
            value={qParams.patient_name}
            onChange={(e) => updateQuery({ [e.name]: e.value })}
            placeholder={t("search_patient")}
          />

          <Tabs
            tabs={[
              { text: t("active"), value: 0 },
              { text: t("archived"), value: 1 },
            ]}
            onTabChange={(tab) =>
              setBoardFilter(tab ? completedBoards : activeBoards)
            }
            currentTab={boardFilter[0].text !== activeBoards[0].text ? 1 : 0}
          />

          <div className="flex w-full flex-col gap-2 lg:mr-4 lg:w-fit lg:flex-row lg:gap-4">
            <ButtonV2
              className="py-[11px]"
              onClick={() => navigate("/shifting/list", { query: qParams })}
            >
              <CareIcon icon="l-list-ul" />
              {t("list_view")}
            </ButtonV2>
            <AdvancedFilterButton
              onClick={() => advancedFilter.setShow(true)}
            />
          </div>
        </div>
      </div>
      <KanbanBoard<ShiftingModel>
        title={<BadgesList {...{ qParams, FilterBadges }} />}
        sections={boardFilter.map((board) => ({
          id: board.text,
          title: (
            <h3 className="flex h-8 items-center text-xs">
              {board.label || board.text}{" "}
              <ExportButton
                action={async () => {
                  const { data } = await request(routes.downloadShiftRequests, {
                    query: {
                      ...formatFilter({ ...qParams, status: board.text }),
                      csv: true,
                    },
                  });
                  return data ?? null;
                }}
                filenamePrefix={`shift_requests_${board.label || board.text}`}
              />
            </h3>
          ),
          fetchOptions: (id) => ({
            route: routes.listShiftRequests,
            options: {
              query: formatFilter({
                ...qParams,
                status: id,
              }),
            },
          }),
        }))}
        onDragEnd={(result) => {
          if (result.source.droppableId !== result.destination?.droppableId)
            navigate(
              `/shifting/${result.draggableId}/update?status=${result.destination?.droppableId}`,
            );
        }}
        itemRender={(shift) => (
          <div className="flex flex-col justify-between gap-4">
            <div>
              <div className="flex justify-between p-4">
                <div>
                  <div className="text-xl font-bold capitalize">
                    {shift.patient_object.name}
                  </div>
                  <div className="text-sm text-secondary-700">
                    {shift.patient_object.age} old
                  </div>
                </div>
                <div>
                  {shift.emergency && (
                    <span className="inline-block shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium leading-4 text-red-800">
                      {t("emergency")}
                    </span>
                  )}
                </div>
              </div>
              <dl className="flex flex-wrap gap-1">
                {(
                  [
                    {
                      title: "phone_number",
                      icon: "l-mobile-android",
                      data: shift.patient_object.phone_number,
                    },
                    {
                      title: "origin_facility",
                      icon: "l-plane-departure",
                      data: shift.origin_facility_object.name,
                    },
                    {
                      title: "shifting_approving_facility",
                      icon: "l-user-check",
                      data: careConfig.wartimeShifting
                        ? shift.shifting_approving_facility_object?.name
                        : undefined,
                    },
                    {
                      title: "assigned_facility",
                      icon: "l-plane-arrival",
                      data:
                        shift.assigned_facility_external ||
                        shift.assigned_facility_object?.name ||
                        t("yet_to_be_decided"),
                    },
                    {
                      title: "last_modified",
                      icon: "l-stopwatch",
                      data: formatDateTime(shift.modified_date),
                      className: dayjs()
                        .subtract(2, "hours")
                        .isBefore(shift.modified_date)
                        ? "text-secondary-900"
                        : "rounded bg-red-500 border border-red-600 text-white w-full font-bold",
                    },
                    {
                      title: "patient_address",
                      icon: "l-home",
                      data: shift.patient_object.address,
                    },
                    {
                      title: "assigned_to",
                      icon: "l-user",
                      data: shift.assigned_to_object
                        ? formatName(shift.assigned_to_object) +
                          " - " +
                          shift.assigned_to_object.user_type
                        : undefined,
                    },
                    {
                      title: "patient_state",
                      icon: "l-map-marker",
                      data: shift.patient_object.state_object?.name,
                    },
                  ] as const
                )
                  .filter((d) => d.data)
                  .map((datapoint, i) => (
                    <div
                      className={classNames(
                        "mx-2 flex items-center gap-2 px-2 py-1",
                        "className" in datapoint ? datapoint.className : "",
                      )}
                      key={i}
                    >
                      <dt title={t(datapoint.title)} className={""}>
                        <CareIcon icon={datapoint.icon} className="text-xl" />
                      </dt>
                      <dd className="text-sm font-semibold">
                        {datapoint.data}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
            <div className="flex flex-col gap-2 px-4 pb-4">
              <Link
                href={`/shifting/${shift.external_id}`}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
              >
                <CareIcon icon="l-eye" className="text-lg" /> {t("all_details")}
              </Link>

              {shift.status === "COMPLETED" && shift.assigned_facility && (
                <>
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-lg border border-secondary-300 bg-secondary-200 p-2 text-sm font-semibold text-inherit transition-all hover:bg-secondary-300"
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
                      setModalFor((m) => ({
                        ...m,
                        externalId: shift.external_id,
                      }))
                    }
                  >
                    {t("transfer_to_receiving_facility")}
                  </button>

                  <ConfirmDialog
                    title={t("confirm_transfer_complete")}
                    description={t("mark_this_transfer_as_complete_question")}
                    show={modalFor.externalId === shift.external_id}
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
                </>
              )}
            </div>
          </div>
        )}
      />
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
