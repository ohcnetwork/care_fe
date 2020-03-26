import React from 'react';
import Grid from '@material-ui/core/Grid';
import { DashboardStatsCard } from '../Common/DashboardStatsCard';
import {Typography} from "@material-ui/core";
export const PrivateDashboard = () => {
    return (
        <Grid item xs={12} style={{marginTop: '75px'}}>
            <Typography variant="h3">
                <span>
                    Updated On 25, March , 2020 at 18:00
                </span>
            </Typography>
            {' '}

            <Grid container justify="flex-start" spacing={5} style={{marginTop: 20}}>
                <Grid item>
                    <DashboardStatsCard title="Patient count" value={105} />
                    <label style={{color: "red"}}>Increased by 13</label>
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Home observation " value={76542} />
                    <label style={{color: "red"}}>Increase by 4548</label>
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Hospital observation " value={466} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Negative Cases" value={3465} />

                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Number of tests done" value={4902} />
                </Grid>
            </Grid>
        </Grid>
    );
};
