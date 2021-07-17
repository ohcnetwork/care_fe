import { CircularProgress, Grid, Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
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
    roundsList = <CircularProgress size={20} />;
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
            }  shadow h-full cursor-pointer hover:border-primary-500 text-black`}
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
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">Temperature:</span>{" "}
                      {itemData.temperature}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">Taken at :</span>{" "}
                      {itemData.temperature_measured_at
                        ? moment(itemData.temperature_measured_at).format("lll")
                        : "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">SpO2:</span>{" "}
                      {itemData.spo2}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">Admitted To:</span>{" "}
                      {itemData.admitted_to || "-"}
                    </Typography>
                  </Grid>
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
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">Created At:</span>{" "}
                      {itemData.created_date
                        ? moment(itemData.created_date).format("lll")
                        : "-"}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography>
                      <span className="text-gray-700">Updated At:</span>{" "}
                      {itemData.modified_date
                        ? moment(itemData.modified_date).format("lll")
                        : "-"}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography>
                      <span className="text-gray-700">
                        Physical Examination Info:
                      </span>{" "}
                      {itemData.physical_examination_info}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography>
                      <span className="text-gray-700">Other Details:</span>{" "}
                      {itemData.other_details}
                    </Typography>
                  </Grid>
                </Grid>
              </Grid>
              <div className="mt-2">
                <Button
                  size="small"
                  variant="outlined"
                  fullWidth
                  onClick={(e) =>
                    navigate(
                      `/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}`
                    )
                  }
                >
                  View Consultation Update Details
                </Button>
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
        <div className="flex flex-wrap mt-4">
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
