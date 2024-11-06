import careConfig from "@careConfig";
import { navigate } from "raviger";
import { Suspense, lazy, useState } from "react";
import { useTranslation } from "react-i18next";

import CareIcon from "@/CAREUI/icons/CareIcon";
import { AdvancedFilterButton } from "@/CAREUI/interactive/FiltersSlideover";

import ButtonV2 from "@/components/Common/ButtonV2";
import ConfirmDialog from "@/components/Common/ConfirmDialog";
import { ExportButton } from "@/components/Common/Export";
import Loading from "@/components/Common/Loading";
import PageTitle from "@/components/Common/PageTitle";
import Tabs from "@/components/Common/Tabs";
import { ShiftingModel } from "@/components/Facility/models";
import SearchInput from "@/components/Form/SearchInput";
import type { KanbanBoardType } from "@/components/Kanban/Board";
import BadgesList from "@/components/Shifting/ShiftingBadges";
import ShiftingBlock from "@/components/Shifting/ShiftingBlock";
import { formatFilter } from "@/components/Shifting/ShiftingCommons";
import ListFilter from "@/components/Shifting/ShiftingFilters";

import useFilters from "@/hooks/useFilters";

import {
  SHIFTING_CHOICES_PEACETIME,
  SHIFTING_CHOICES_WARTIME,
} from "@/common/constants";

import routes from "@/Utils/request/api";
import request from "@/Utils/request/request";

const KanbanBoard = lazy(
  () => import("@/components/Kanban/Board"),
) as KanbanBoardType;

export default function BoardView() {
  const { qParams, updateQuery, FilterBadges, advancedFilter } = useFilters({
    limit: -1,
    cacheBlacklist: ["patient_name"],
  });

  const [modalFor, setModalFor] = useState<ShiftingModel>();

  const handleTransferComplete = async (shift?: ShiftingModel) => {
    if (!shift) return;
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
            className="w-full md:w-60"
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
      <Suspense fallback={<Loading />}>
        <KanbanBoard<ShiftingModel>
          title={<BadgesList {...{ qParams, FilterBadges }} />}
          sections={boardFilter.map((board) => ({
            id: board.text,
            title: (
              <h3 className="flex h-8 items-center text-xs">
                {board.label || board.text}{" "}
                <ExportButton
                  action={async () => {
                    const { data } = await request(
                      routes.downloadShiftRequests,
                      {
                        query: {
                          ...formatFilter({ ...qParams, status: board.text }),
                          csv: true,
                        },
                      },
                    );
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
            <ShiftingBlock
              onTransfer={() => setModalFor(shift)}
              shift={shift}
            />
          )}
        />
      </Suspense>
      <ConfirmDialog
        title={t("confirm_transfer_complete")}
        description={t("mark_this_transfer_as_complete_question")}
        show={!!modalFor}
        onClose={() => setModalFor(undefined)}
        action={t("confirm")}
        onConfirm={() => handleTransferComplete(modalFor)}
      >
        <p className="mt-2 text-sm text-yellow-600">
          {t("redirected_to_create_consultation")}
        </p>
      </ConfirmDialog>
      <ListFilter {...advancedFilter} key={window.location.search} />
    </div>
  );
}
