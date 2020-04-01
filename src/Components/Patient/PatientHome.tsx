import React, { useState, useCallback } from 'react';
import { Grid, Typography, Button, Divider, Box } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";
import { useDispatch } from "react-redux";
import { navigate } from 'hookrouter';
import { Loading } from '../Common/Loading';
import { getPatient } from '../../Redux/actions';
import { PatientModal } from './models';
import { MEDICAL_HISTORY_CHOICES, GENDER_TYPES } from "../../Common/constants";
import { useAbortableEffect, statusType } from '../../Common/utils';


const useStyles = makeStyles(theme => ({
    root: {
        flexGrow: 1,
        padding: '8px'
    },
    margin: {
        margin: theme.spacing(1)
    },
    displayFlex: {
        display: 'flex'
    },
    content: {
        marginTop: "10px",
        maxWidth: "560px",
        background: "white",
        padding: "20px 20px 5px",
    },
    title: {
        padding: '5px',
        marginBottom: '10px',
    },
    details:{ 
        padding:'5px', 
        marginBottom: '10px',
    }
}));

export const PatientHome = (props: any) => {
    const { facilityId, id } = props;
    const classes = useStyles();
    const dispatch: any = useDispatch();
    const [patientData, setPatientData] = useState<PatientModal>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = useCallback(async (status: statusType) => {
        const patientRes = await dispatch(getPatient({ id }));
        if (!status.aborted) {
            if (patientRes && patientRes.data) {
                setPatientData(patientRes.data);
            }
            setIsLoading(false);
        }
    }, [dispatch, id]);

    useAbortableEffect((status: statusType) => {
        setIsLoading(true);
        fetchData(status);
    }, [dispatch, fetchData]);

    if (isLoading) {
        return <Loading />
    }

    const patientGender = GENDER_TYPES.find(i => i.id === patientData.gender)?.text;

    let patientMedHis: any[] = [];
    if (patientData && patientData.medical_history && patientData.medical_history.length) {
        const medHis = patientData.medical_history;
        patientMedHis = medHis.map((item: any, idx: number) => (
            <tr key={`med_his_${idx}`}>
                <td>{item.disease}</td>
                <td>{item.details}</td>
            </tr>
        ));
    }
    
    return (
        <div className={`w3-content ${classes.content}`}>
            <h2>Patient</h2>
            <Grid container style={{ padding: "10px", marginBottom: '5px' }} spacing={2}>
                <Grid item xs={12} md={7}>
                    <Typography variant="h6" component="h6">{patientData.name}</Typography>
                    <Typography>Age : {patientData.age}</Typography>
                    <Typography>Gender : {patientGender}</Typography>
                    <Typography>Phone : {patientData.phone_number}</Typography>
                </Grid>
                <Grid item xs={12} md={5}>
                    <Grid container spacing={1} direction="column">
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={() => navigate(`/facility/${facilityId}/patient/${id}/update`)}>
                                Update Patient Info
                            </Button>
                        </Grid>
                        <Grid item xs={12} className="w3-center">
                            <Button fullWidth variant="contained" color="primary" size="small"
                                onClick={() => navigate(`/facility/${facilityId}/patient/${id}/treatment`)}>
                                Add Treatement Info
                            </Button>
                        </Grid>

                    </Grid>
                </Grid>
            </Grid>
            <Grid container style={{ padding: "10px" }} spacing={1}>
                <Grid item xs={12} md={6} className="w3-center">
                    <Button fullWidth variant="contained" color="primary" size="small"
                        onClick={() => navigate(`/facility/${facilityId}/patient/${id}/sample-test`)}>
                        Request Sample Test
                    </Button>
                </Grid>
                <Grid item xs={12} md={6} className="w3-center">
                    <Button fullWidth variant="contained" color="primary" size="small"
                        onClick={() => navigate(`/facility/${facilityId}/patient/${id}/sample-test-list`)}>
                        View Sample Test List
                    </Button>
                </Grid>
            </Grid>

            <Grid container style={{ padding: "10px" }} spacing={1}>
                <Grid item xs={12}>
                    <div className={`w3-black ${classes.title}`}>
                        <Typography>
                            Has the patient had contact with someone already diagnosed with Covid 19?
                      </Typography>
                    </div>
                    <div className={classes.details}>
                        <Typography>
                            {patientData.contact_with_carrier ? 'Yes' : 'No'}
                        </Typography>
                    </div>
                </Grid>
                <Grid item xs={12}>
                    <div className={`w3-black w3-center ${classes.title}`}>
                        <Typography>
                            Medical History
                        </Typography>
                    </div>
                    <div className={classes.details}>
                        {patientMedHis.length > 0? 
                    <table className="w3-table w3-table-all">
                        <thead>
                            <tr>
                                <th className="w3-center">Disease</th>
                                <th className="w3-center">Details</th>
                            </tr>
                        </thead>
                        <tbody>
                          {patientMedHis} 
                        </tbody>
                    </table>
                        :(<span className="w3-center"><h6 className="w3-text-grey">No Medical History so far</h6></span>)}
                    </div>
                </Grid>
                <Grid item xs={12}>
                    <div className={`w3-black w3-center ${classes.title}`}>
                        <Typography>
                            Treatment History
                        </Typography>
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <Typography>
                            Treatment history details
                        </Typography>
                    </div>
                </Grid>
            </Grid>
        </div>
    );

};
