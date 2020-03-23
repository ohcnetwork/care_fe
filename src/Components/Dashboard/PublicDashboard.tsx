import React from 'react';
import Grid from '@material-ui/core/Grid';
import { DashboardStatsCard } from '../Common/DashboardStatsCard';
import {Typography} from "@material-ui/core";

export const PublicDashboard = () => {
    return (
        <Grid item xs={12} style={{marginTop: '75px'}}>
            <Typography variant="h3">
                <span>
                    Updated On 23, March , 2020 at 18:00
                </span>
            </Typography>
            {' '}

            <Grid container justify="flex-start" spacing={5} style={{marginTop: 20}}>
                <Grid item>
                    <DashboardStatsCard title="Patient count" value={91} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Home observation " value={64320} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Hospital observation " value={383} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Negative Cases" value={2987} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Number of tests done" value={4291} />
                </Grid>
            </Grid>
        </Grid>
    );
};
