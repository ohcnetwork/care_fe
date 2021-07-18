import { Grid, Typography } from "@material-ui/core";
import { navigate } from "raviger";
import moment from "moment";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../../Common/utils";
import { getDailyReport } from "../../../Redux/actions";
import loadable from "@loadable/component";
import Pagination from "../../Common/Pagination";
import { DailyRoundsModel } from "../../Patient/models";
import { PATIENT_CATEGORY } from "../../../Common/constants";
import { smallCard } from "../../Common/components/SkeletonLoading.gen";

const PageTitle = loadable(() => import("../../Common/PageTitle"));

const patientCategoryChoices = [...PATIENT_CATEGORY];

export const DailyRoundsList = (props: any) => {
  const { facilityId, patientId, consultationId, consultationData } = props;
  const dispatch: any = useDispatch();
  const [isDailyRoundLoading, setIsDailyRoundLoading] = useState(false);
  const [dailyRoundsListData, setDailyRoundsListData] = useState<
    Array<DailyRoundsModel>
  >([]);
  const [totalCount, setTotalCount] = useState(0);
  const [offset, setOffset] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 14;

  const fetchDailyRounds = useCallback(
    async (status: statusType) => {
      setIsDailyRoundLoading(true);
      const res = await dispatch(
        getDailyReport({ limit, offset }, { consultationId })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setDailyRoundsListData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsDailyRoundLoading(false);
      }
    },
    [consultationId, dispatch, offset]
  );

  useAbortableEffect((status: statusType) => {
    fetchDailyRounds(status);
  }, []);

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  let roundsList: any;

  if (isDailyRoundLoading) {
    roundsList = smallCard();
  } else if (dailyRoundsListData.length === 0) {
    roundsList = (
      <Typography>No Consultation Update data is available.</Typography>
    );
  } else if (dailyRoundsListData.length > 0) {
    roundsList = dailyRoundsListData.map((itemData, idx) => {
      const telemedicine_doctor_update =
        itemData.created_by_telemedicine ||
        itemData.last_updated_by_telemedicine;

      return (
        <div key={`daily_round_${idx}`} className="w-full mt-4 px-2">
          <div
            className={`block border rounded-lg ${
              telemedicine_doctor_update ? "bg-purple-200" : "bg-white"
            }  shadow h-full cursor-pointer`}
          >
            <div className="p-4">
              <Grid container justify="space-between" alignItems="center">
                <Grid item xs={11} container spacing={1}>
                  {telemedicine_doctor_update ? (
                    <Grid item xs={6}>
                      <Typography>
                        <span className="text-gray-700">Updated by:</span>{" "}
                        {telemedicine_doctor_update &&
                        consultationData.assigned_to_object
                          ? consultationData.assigned_to_object.first_name +
                            " " +
                            consultationData.assigned_to_object.last_name
                          : "-"}
                      </Typography>
                    </Grid>
                  ) : null}
                  {itemData.patient_category && (
                    <Grid item xs={12}>
                      <Typography>
                        <span className="text-gray-700">Category: </span>
                        <span className="badge badge-pill badge-warning">
                          {patientCategoryChoices.find(
                            (i) => i.id === itemData.patient_category
                          )?.text || "-"}
                        </span>
                      </Typography>
                    </Grid>
                  )}
                  <Grid item xs={6}>
                    <div className="text-xs">
                      <span className="text-gray-700">Created At:</span>{" "}
                      <div className="text-xs">
                        {itemData.created_date
                          ? moment(itemData.created_date).format("lll")
                          : "-"}
                      </div>
                    </div>
                  </Grid>
                  <Grid item xs={6}>
                    <div className="text-xs">
                      <span className="text-gray-700">Updated At:</span>{" "}
                      <div className="text-xs">
                        {itemData.modified_date
                          ? moment(itemData.modified_date).format("lll")
                          : "-"}
                      </div>
                    </div>
                  </Grid>

                  {itemData.physical_examination_info && (
                    <Grid item xs={12}>
                      <Typography>
                        <span className="text-gray-700">
                          Physical Examination Info:
                        </span>{" "}
                        {itemData.physical_examination_info}
                      </Typography>
                    </Grid>
                  )}
                  {itemData.other_details && (
                    <Grid item xs={12}>
                      <Typography>
                        <span className="text-gray-700">Other Details:</span>{" "}
                        {itemData.other_details}
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Grid>
              <div className="mt-2 flex md:flex-row flex-col md:space-y-0 space-y-2 space-x-0 md:space-x-2">
                <button
                  className="btn btn-default"
                  onClick={(e) =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}`
                    )
                  }
                >
                  <i className="fas fa-eye mr-2" />
                  View Consultation Update Details
                </button>
                <button
                  className="btn btn-default"
                  onClick={(e) =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily_rounds/${itemData.id}/update`
                    )
                  }
                >
                  <i className="fas fa-pencil-alt mr-2" />
                  Update Log
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  return (
    <div>
      <div>
        <PageTitle title="Consultation Update" hideBack={true} />
        <div className="flex flex-wrap">
          {roundsList}
          {!isDailyRoundLoading && totalCount > limit && (
            <div className="mt-4 flex w-full justify-center">
              <Pagination
                cPage={currentPage}
                defaultPerPage={limit}
                data={{ totalCount }}
                onChange={handlePagination}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
