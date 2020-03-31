import React from 'react';
import { Grid, Card, CardContent, Typography } from '@material-ui/core';
import moment from 'moment';
import { navigate } from 'hookrouter';
import { SampleTestModel } from './models';

interface ConsultationProps {
    itemData: SampleTestModel;
}

export const SampleTestCard = (props: any) => {
    const { itemData } = props;

    return (<Card style={{ marginBottom: '10px' }}>
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
                    {itemData.date_of_result && (<Grid item xs={6}>
                        <Typography>
                            <span className="w3-text-grey">Tested on :</span> {moment(itemData.date_of_result).format('lll')}
                        </Typography>
                    </Grid>)}
                    {itemData.date_of_result && (<Grid item xs={6}>
                        <Typography>
                            <span className="w3-text-grey">Result on:</span> {moment(itemData.date_of_result).format('lll')}
                        </Typography>
                    </Grid>)}
                </Grid>
            </Grid>
        </CardContent>
    </Card>
    )
}