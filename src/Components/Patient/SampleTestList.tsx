import React, { useState, useCallback, } from 'react';
import { Grid, InputLabel, Card, CardHeader, CardContent, Button, IconButton, Typography } from '@material-ui/core'
import { makeStyles } from "@material-ui/core/styles";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { useDispatch } from "react-redux";
import { getSampleTestList } from "../../Redux/actions";
import moment from 'moment';
import Pagination from "../Common/Pagination";
import { navigate } from 'hookrouter';
import { Loading } from '../Common/Loading';
import { useAbortableEffect, statusType } from '../../Common/utils';


const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: theme.spacing(2),
        margin: 'auto',
    },
    paginateTopPadding: {
        paddingTop: '50px'
    },
}));


export const SampleTestList = (props: any) => {
    const { facilityId, patientId, id } = props;
    let manageTestLists: any = [];
    const classes = useStyles();
    const dispatchAction: any = useDispatch();
    const [currentPage, setCurrentPage] = useState(1);
    const [totalCount, setTotalCount] = useState(6);
    const [offset, setOffset] = useState(0);
    const limit = 5;
    const [sampleListData, setSampleListData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async (status: statusType) => {
        setIsLoading(true);
        const res = await dispatchAction(getSampleTestList({ limit, offset }));
        console.log(res);

        if (!status.aborted) {
            if (res && res.data) {
                setSampleListData(res.data.results);
                setTotalCount(res.data.count);
            }
            setIsLoading(false);
        }
    }, [dispatchAction, offset]);

    useAbortableEffect((status: statusType) => {
        fetchData(status);
    }, [fetchData]);

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    let testList: any[] = [];
    if (sampleListData && sampleListData.length) {
        testList = sampleListData.map((itemData: any, idx: number) => {
            return (
                <Card key={`sample-test_${idx}`} style={{ marginBottom: '10px' }}>
                    <CardContent>
                        <Grid container justify="space-between" alignItems="center">
                            <Grid item xs={11} container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography>
                                        <span className="w3-text-grey">Status:</span> {itemData.status}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>
                                        <span className="w3-text-grey">Result:</span> {itemData.result}
                                    </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                    <Typography>
                                        <span className="w3-text-grey">Notes:</span> {itemData.notes}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>
                                        <span className="w3-text-grey">Tested on :</span> {moment(itemData.date_of_result).format('lll')}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography>
                                        <span className="w3-text-grey">Result on:</span> {moment(itemData.date_of_result).format('lll')}
                                    </Typography>
                                </Grid>
                            </Grid>
                            <Grid item xs={1}>
                                <IconButton
                                    onClick={() => {
                                        navigate(`/facility/${facilityId}/patient/${patientId}/sample-test/${itemData.id}/update`)
                                    }}>
                                    <ArrowForwardIosIcon />
                                </IconButton>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
            );
        });
    }


    if (isLoading || !sampleListData) {
        manageTestLists =  (
            <Loading />
        );
    } else if (sampleListData && sampleListData.length) {
        manageTestLists = (
            <>
                {testList}
                {(totalCount > limit) && (
                    <Grid container className={`w3-center ${classes.paginateTopPadding}`}>
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
    } else if (sampleListData && sampleListData.length === 0) {
        manageTestLists = (
            <Grid container alignContent="center" justify="center">
                <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                    <h5> No Users Found</h5>
                </Grid>
            </Grid>
        );
    }

    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
               {manageTestLists}
            </Grid>
        </Grid>
    </div>
}
