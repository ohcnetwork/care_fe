import { Grid, Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import moment from 'moment';
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getDailyReport } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { navigate } from "hookrouter";

export const DailyRoundsList = (props: any) => {
    const { facilityId, patientId, consultationId } = props;
    const dispatch: any = useDispatch();
    const initialData: any[] = [];
    let manageRounds: any = null;
    const [isLoading, setIsLoading] = useState(false);
    const [dailyRoundsListData, setDailyRoundsListData] = useState(initialData);
    const [totalCount, setTotalCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const limit = 5;
    const [currentPage, setCurrentPage] = useState(1);
    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatch(getDailyReport({ limit, offset }, { consultationId }));
            if (!status.aborted) {
                if (res && res.data) {
                    setDailyRoundsListData(res.data.results);
                    setTotalCount(res.data.count);
                }
                setIsLoading(false);
            }
        },
        [consultationId, dispatch, offset]
    );

    useAbortableEffect(
        (status: statusType) => {
            fetchData(status);
        },
        [fetchData]
    );

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    let roundsList: any[] = [];
    if (dailyRoundsListData && dailyRoundsListData.length) {
        roundsList = dailyRoundsListData.map((itemData: any, idx: any) => {
            return (
                <div key={`daily_round_${idx}`} className="w-full mt-4 px-2">
                    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black">
                        <div className="p-4">
                            <Grid container justify="space-between" alignItems="center">
                                <Grid item xs={11} container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Temperature:</span>{" "}
                                            {itemData.temperature}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Temperature taken at :</span>{" "}
                                            {itemData.temperature_measured_at ? moment(itemData.temperature_measured_at).format('lll') : "-"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="w3-text-grey">Physical Examination Info:</span>{" "}
                                            {itemData.physical_examination_info}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="w3-text-grey">Other Details:</span>{" "}
                                            {itemData.other_details}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <div className="mt-2">
                                <Button size="small" variant="outlined" fullWidth onClick={(e) => navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds-list/${itemData.id}`)}>
                                View Daily Rounds Details
                                </Button>
                            </div>
                        </div>
                    </div>
                </div >
            );
        });
    }
    if (isLoading || !dailyRoundsListData) {
        manageRounds = <Loading />;
    } else if (dailyRoundsListData && dailyRoundsListData.length) {
        manageRounds = (
            <>
                {roundsList}
                {totalCount > limit && (
                    <Grid container className={`w3-center`} style={{ paddingTop: "50px" }}>
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{ totalCount }}
                            onChange={handlePagination}
                        />
                    </Grid>
                )}
            </>
        );
    } else if (dailyRoundsListData && dailyRoundsListData.length === 0) {
        manageRounds = (
            <Grid item xs={12} md={12} className="textMarginCenter">
                <h5> No Rounds Data Found</h5>
            </Grid>
        );
    }

    return (
        <div>
            <PageTitle title="Daily Rounds" />
            <div className="flex flex-wrap mt-4">{manageRounds}</div>
        </div>
    );
};
