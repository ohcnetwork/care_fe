import React from 'react';
import Grid from '@material-ui/core/Grid';
import { DashboardStatsCard } from '../Common/DashboardStatsCard';
export const PrivateDashboard = () => {
return (
    <div>
        <Grid item xs={12} style={{marginTop: '75px'}}>
            <Grid container justify="flex-start" spacing={5}>
                <Grid item>
                    <DashboardStatsCard title="Patient count" value={25} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="People in observation" value={10} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Positive Cases" value={7} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Negative Cases" value={18} />
                </Grid>
                <Grid item>
                    <DashboardStatsCard title="Number of tests done" value={44} />
                </Grid>
            </Grid>
        </Grid>
    </div>
)
};
