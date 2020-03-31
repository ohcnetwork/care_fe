import React, { useState, useCallback } from 'react';
import { Grid, InputLabel, Card, CardHeader, CardContent, Button, IconButton, Typography } from '@material-ui/core'
import { makeStyles } from "@material-ui/core/styles";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';
import { useDispatch } from "react-redux";
import moment from 'moment';
import { navigate } from 'hookrouter';
import { Loading } from '../Common/Loading';
import { getConsultationList } from '../../Redux/actions';
import { ConsultationModal } from './models';
import { useAbortableEffect, statusType } from '../../Common/utils';

export const ConsultationList = (props: any) => {
    const { facilityId, patientId } = props;
    const dispatch: any = useDispatch();
    const [consultationListData, setConsultationListData] = useState<Array<ConsultationModal>>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async (status: statusType) => {
        const res = await dispatch(getConsultationList({
            patient: patientId
        }));
        if (!status.aborted) {
            if (res && res.data && res.data.results) {
                setConsultationListData(res.data.results);
            }
            setIsLoading(false);
        }
    }, [dispatch, patientId]);

    useAbortableEffect((status: statusType) => {
        setIsLoading(true);
        fetchData(status);
    }, [dispatch, fetchData]);

    if (isLoading) {
        return <Loading />
    }

    return <div>
        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                {consultationListData.map((itemData, idx) =>
                    <Card key={`consultation_${idx}`} style={{ marginBottom: '10px' }}>
                        <CardContent>
                            <Grid container justify="space-between" alignItems="center">
                                <Grid item xs={11} container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Facility:</span> {itemData.facility}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Patient:</span> {itemData.patient}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Suggetion:</span> {itemData.suggestion}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Admitted:</span> {itemData.admitted ? 'Yes' : 'No'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography style={{ fontSize: '12px' }}>
                                            <span className="w3-text-grey">Admitted on :</span> {moment(itemData.admission_date).format('lll')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography style={{ fontSize: '12px' }}>
                                            <span className="w3-text-grey">Discharged on:</span> {moment(itemData.discharge_date).format('lll')}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                {false && <Grid item xs={1}>
                                    <IconButton
                                        onClick={() => {
                                            navigate(`/facility/${facilityId}/patient/${patientId}/sample-test/${itemData.id}/update`)
                                        }}>
                                        <ArrowForwardIosIcon />
                                    </IconButton>
                                </Grid>}
                            </Grid>
                        </CardContent>
                    </Card>)}
            </Grid>
        </Grid>
    </div>
}