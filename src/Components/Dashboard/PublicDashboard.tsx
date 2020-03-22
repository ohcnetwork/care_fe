import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Grid from '@material-ui/core/Grid';
import Card from '@material-ui/core/Card';
import { StatsCard } from '../Common/StatsCard';

interface Props {

}
export const PublicDashboard: React.FC<Props> = (props) => {
    return (
        <Grid item xs={12}>
            <Grid container justify="flex-start" spacing={5}>
                <Grid item>
                    <StatsCard title="Patient count" value={25} />
                </Grid>
                <Grid item>
                    <StatsCard title="People in observation" value={10} />
                </Grid>
                <Grid item>
                    <StatsCard title="Positive Cases" value={7} />
                </Grid>
                <Grid item>
                    <StatsCard title="Negative Cases" value={18} />
                </Grid>
                <Grid item>
                    <StatsCard title="Number of tests done" value={44} />
                </Grid>
            </Grid>
        </Grid>
    );
}
