import React from 'react';
import Grid from '@material-ui/core/Grid';
import { DashboardStatsCard } from '../Common/DashboardStatsCard';
import {Typography} from "@material-ui/core";

export const PublicDashboard = () => {
    return (
        <Grid item xs={12} style={{marginTop: '75px'}}>
            <Typography variant="h3">
                <span>
                    Updated On 24, March , 2020 at 18:00
                </span>
            </Typography>
            {' '}

            <Grid container justify="flex-start" spacing={5} style={{marginTop: 20}}>
                <Grid item>
                    <DashboardStatsCard title="Patient count" value={105} />
                    <label style={{color: "lightseagreen"}}>Reduced by 4</label>
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Home observation " value={71994} />
                    <label style={{color: "red"}}>Increase by 7674</label>
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in Hospital observation " value={466} />
                    <label  style={{color: "red"}}>Increase by 183</label>
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Negative Cases" value={3331} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Number of tests done" value={4516} />
                </Grid>
            </Grid>
        </Grid>
    );
};
