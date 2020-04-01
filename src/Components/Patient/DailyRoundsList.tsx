import React, { useState, useReducer, useCallback, useEffect } from "react"
import { makeStyles, Theme } from '@material-ui/core/styles';
import { useDispatch } from "react-redux";
import { Grid, Card, CardHeader, CardContent, CardActions, Button, Box, Typography, IconButton, } from "@material-ui/core";
import { navigate } from 'hookrouter';
import moment from 'moment';
import { Loading } from "../Common/Loading";
import ArrowForwardIosIcon from '@material-ui/icons/ArrowForwardIos';

const useStyles = makeStyles((theme: Theme) => ({
    formControl: {
        margin: theme.spacing(1)
    },
}));


export const DailyRoundsList = (props: any) => {
    const { facilityId, patientId, id } = props;
    const classes = useStyles();
    const [isLoading, setIsLoading] = useState(false);
    const [dailyRoundsListData, setDailyRoundsListData] = useState([{
        "id": 0,
        "temperature": "102",
        "temperature_measured_at": "2020-03-31T07:20:19Z",
        "physical_examination_info": "string",
        "other_details": "string",
        "consultation": 0
    }]);


    if (isLoading) {
        return <Loading />
    }

    return <div>

        <Grid container alignContent="center" justify="center">
            <Grid item xs={12} sm={10} md={8} lg={6} xl={4}>
                {dailyRoundsListData.map((itemData, idx) =>
                    <Card key={`daily_round_${idx}`} style={{ marginBottom: '10px' }}>
                        <CardContent>
                            <Grid container justify="space-between" alignItems="center">
                                <Grid item xs={11} container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Date :</span> {moment(itemData.temperature_measured_at).format('lll')}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="w3-text-grey">Temperature:</span> {itemData.temperature}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="w3-text-grey">Physical Examination Info:</span> {itemData.physical_examination_info}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="w3-text-grey">Other Details:</span> {itemData.other_details}
                                        </Typography>
                                    </Grid>
                                </Grid>
                                <Grid item xs={1}>
                                    <IconButton
                                        onClick={() => { }}>
                                        <ArrowForwardIosIcon />
                                    </IconButton>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>)}
            </Grid>
        </Grid>
    </div>
};
