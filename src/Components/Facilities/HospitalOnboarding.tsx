import React from 'react';
import Grid from '@material-ui/core/Grid';
import { HospitalView } from '../Common/HospitalView';
export const HospitalOnboarding = () => {
    return (
        <div>
            Hospital Onboarding .
        <Grid item xs={12} style={{marginTop: '75px'}}>
            <Grid container justify="flex-start" spacing={5}>
                <Grid item>
                    <HospitalView name="Hospital 1" addr="Random 1" phone="phone_number" district="get_district_display"/> 
                </Grid>
                <Grid item>
                    <HospitalView name="Hospital 2" addr="Random 2" phone="phone_number" district="get_district_display"/>
                </Grid>
                <Grid item>
                    <HospitalView name="Hospital 3" addr="Random 3" phone="phone_number" district="get_district_display"/>
                </Grid>
                <Grid item>
                    <HospitalView name="Hospital 4" addr="Random 4" phone="phone_number" district="get_district_display"/>
                </Grid>
                <Grid item>
                    <HospitalView name="Hospital 5" addr="Random 5" phone="phone_number" district="get_district_display"/> 
                </Grid>
                <Grid item>
                    <HospitalView name="Hospital 6" addr="Random 6" phone="phone_number" district="get_district_display"/>
                </Grid>
                
            </Grid>
        </Grid>
    </div>
    
    )
};
