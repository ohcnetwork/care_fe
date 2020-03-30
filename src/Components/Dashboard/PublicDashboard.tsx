import React from 'react';
import Grid from '@material-ui/core/Grid';
import { DashboardStatsCard } from '../Common/DashboardStatsCard';
import {Typography, Link, Button} from "@material-ui/core";

export const PublicDashboard = () => {
    return (
        <Grid item xs={12}>
            <Typography variant="h4" className="hometitle" gutterBottom align="center">
            Corona Safe Network
            </Typography>
            <Typography className="hometext" variant="h6" align="justify">
             Our Goal is to defend the Healthcare system of Kerala from overloading beyond capacity.
            For this to happen, the Chief Minister's Office needs access to the live capacity utilisation of the healthcare system against the total capacity.
            Corona Care is a tool designed for hospital administrators to send the most up-to-date information in a real-time basis to CMO through the Control Room setup by State Disaster Management Authority.
            This tool is made on request of Kerala State Disaster Management Authority for gathering information of private hospitals as ordered vide &nbsp;
            <Link href="https://drive.google.com/file/d/1CIK_h-cHRzX3qfWG1CYDRpageffGDgtE/view?usp=sharing">GO (Ms) No 48/2020/GAD dated 21-3-2020
            </Link>.
            </Typography>
            {' '}
            <Grid item xs={12} container={true} justify="center">
            <Button variant="contained" style={{marginTop: '15px', marginRight:'5px'}} color="primary" href="/register">
            KSDMA: Hospital Registration
            </Button>
            <Button variant="contained" style={{marginTop: '15px', marginLeft:'5px'}} color="primary" href="/ambulance">
            Add Ambulance Details
            </Button>
            </Grid>
        </Grid>
    );
};
