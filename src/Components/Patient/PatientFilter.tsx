import { TextFieldProps } from '@material-ui/core';
import Grid from "@material-ui/core/Grid";
import { makeStyles } from '@material-ui/core/styles';
import React, { useState } from 'react';
import { DISEASE_STATUS } from "../../Common/constants";
import { SelectField } from "../Common/HelperInputFields";

const useStyles = makeStyles(theme => ({
    searchboxInput: {
        background: "#ffffff"
    },
    searchboxSticky: {
        position: "sticky",
        zIndex: 1,
        top: "0px",
        background: "#edf2f7",
    }
}));

const diseaseStatusOptions = [ 'Show All', ...DISEASE_STATUS];

type TextFieldPropsExtended = TextFieldProps & { errors: string, search: (value: string) => void }

export const PatientFilter = (props: any) => {
    const classes = useStyles();
    const [diseaseStatus, setDiseaseStatus] = useState('Show All');
    const { filter } = props;

    const handleChange = (event:any) => {
        setDiseaseStatus(event.target.value)
        const filterVal = event.target.value !== 'Show All' ? event.target.value : '';
        filter(filterVal);
    };

    return (
        <Grid item xs={6} md={12} className={classes.searchboxSticky}>
            <Grid container justify="center" alignItems="center" className='mt-4'>

                <SelectField
                    name="disease_status"
                    variant="outlined"
                    margin="dense"
                    optionArray={true}
                    value={diseaseStatus}
                    options={diseaseStatusOptions}
                    onChange={(value: any) => handleChange(value)}
                />
            </Grid>
        </Grid>
    )
}