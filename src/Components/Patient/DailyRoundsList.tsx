import React, {useCallback, useState} from "react"
import {makeStyles, Theme} from '@material-ui/core/styles';
import {useDispatch} from "react-redux";
import {Card, CardContent, Grid, IconButton, Typography,} from "@material-ui/core";
import moment from 'moment';
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import {statusType, useAbortableEffect} from "../../Common/utils";
import {getDailyReport} from "../../Redux/actions";
import {Loading} from "../Common/Loading";
import Pagination from "../Common/Pagination";
import PageTitle from "../Common/PageTitle";

const useStyles = makeStyles((theme: Theme) => ({
    formControl: {
        margin: theme.spacing(1)
    },
}));


export const DailyRoundsList = (props: any) => {
    const {facilityId, patientId, consultationId, id} = props;
    const classes = useStyles();
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
            const res = await dispatch(getDailyReport({consultationId, limit, offset}));
            if (!status.aborted) {
                if (res && res.data) {
                    setDailyRoundsListData(res.data.results);
                    setTotalCount(res.data.count);
                }
                setIsLoading(false);
            }
        },
        [dispatch, offset]
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
        roundsList =  dailyRoundsListData.map((itemData: any, idx: any) => {
            return (
                <div>
                    <Grid container alignContent="center" justify="center">
                        <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                            {
                                <Card key={`daily_round_${idx}`} style={{marginBottom: '10px'}}>
                                    <CardContent>
                                        <Grid container justify="space-between" alignItems="center">
                                            <Grid item xs={11} container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <span
                                                            className="w3-text-grey">Date :</span> {moment(itemData.temperature_measured_at).format('lll')}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={6}>
                                                    <Typography>
                                                        <span
                                                            className="w3-text-grey">Temperature:</span> {itemData.temperature}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography>
                                                        <span
                                                            className="w3-text-grey">Physical Examination Info:</span> {itemData.physical_examination_info}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12}>
                                                    <Typography>
                                                        <span
                                                            className="w3-text-grey">Other Details:</span> {itemData.other_details}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                            <Grid item xs={1}>
                                                <IconButton
                                                    onClick={() => {
                                                    }}>
                                                    <ArrowForwardIosIcon/>
                                                </IconButton>
                                            </Grid>
                                        </Grid>
                                    </CardContent>
                                </Card>
                            }
                        </Grid>
                    </Grid>
                </div>
            );
        });
    }
    if (isLoading || !dailyRoundsListData) {
        manageRounds = <Loading/>;
    } else if (dailyRoundsListData && dailyRoundsListData.length) {
        manageRounds = (
            <>
                {roundsList}
                {totalCount > limit && (
                    <Grid container className={`w3-center`} style={{paddingTop: "50px"}}>
                        <Pagination
                            cPage={currentPage}
                            defaultPerPage={limit}
                            data={{totalCount}}
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
            <PageTitle title="Daily Rounds" hideBack={true}/>
            <div className="flex flex-wrap mt-4">{manageRounds}</div>
        </div>
    );
};
